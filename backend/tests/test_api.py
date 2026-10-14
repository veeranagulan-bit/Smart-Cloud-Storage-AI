import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import db
from app.ai.classifier import classifier
from app.ai.extractor import extract_text_from_bytes
from app.ai.embeddings import embedding_engine

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    db.connect()

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data
    assert "storage" in data

def test_auth_login_demo():
    response = client.post("/api/auth/login", json={
        "email": "demo@antigravity.ai",
        "password": "Demo123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "demo@antigravity.ai"

def test_auth_register_and_isolation():
    test_email = "testuser_unique_2026@test.com"
    # Clean if exists
    db.users.delete_one({"email": test_email})

    reg_resp = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "Password123!",
        "name": "Test User"
    })
    assert reg_resp.status_code == 200
    test_token = reg_resp.json()["access_token"]
    test_headers = {"Authorization": f"Bearer {test_token}"}

    # Verify user me
    me_resp = client.get("/api/auth/me", headers=test_headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == test_email

    # New user should have 0 files
    files_resp = client.get("/api/files", headers=test_headers)
    assert files_resp.status_code == 200
    assert len(files_resp.json()) == 0

    # Demo user has files (User Isolation Verified!)
    demo_files_resp = client.get("/api/files")  # falls back to demo user
    assert demo_files_resp.status_code == 200
    assert len(demo_files_resp.json()) >= 20

def test_dashboard_data():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_files" in data
    assert "storage_used" in data
    assert "available_storage" in data
    assert "duplicate_count" in data
    assert "storage_distribution" in data
    assert "recent_files" in data
    assert len(data["recent_files"]) > 0

def test_files_listing_and_filtering():
    # List all
    res_all = client.get("/api/files")
    assert res_all.status_code == 200
    all_files = res_all.json()
    assert len(all_files) > 0

    # Filter by category
    res_edu = client.get("/api/files?category=Educational")
    assert res_edu.status_code == 200
    for f in res_edu.json():
        assert f["category"] == "Educational"

    # Search filter
    res_search = client.get("/api/files?q=Revenue")
    assert res_search.status_code == 200
    assert any("Revenue" in f["name"] for f in res_search.json())

def test_file_upload_and_lifecycle():
    # 1. Upload a test document
    file_content = b"Q4 Financial Performance Audit Report. Detailed revenue figures and fiscal analysis."
    files = [("files", ("audit_report_q4.txt", file_content, "text/plain"))]
    
    upload_res = client.post("/api/files/upload", files=files)
    assert upload_res.status_code == 200
    uploaded = upload_res.json()["uploaded"][0]
    file_id = uploaded["id"]
    assert uploaded["name"] == "audit_report_q4"
    assert uploaded["ext"] == "txt"
    assert uploaded["category"] in ["Reports", "Business"]

    # 2. Get file detail
    detail_res = client.get(f"/api/files/{file_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == file_id

    # 3. Download file
    down_res = client.get(f"/api/files/{file_id}/download")
    assert down_res.status_code == 200
    assert down_res.content == file_content

    # 4. Rename file
    patch_res = client.patch(f"/api/files/{file_id}", json={"name": "audit_report_q4_renamed", "favorite": True})
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "audit_report_q4_renamed"
    assert patch_res.json()["favorite"] is True

    # 5. Delete file
    del_res = client.delete(f"/api/files/{file_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Verify deleted
    verify_del = client.get(f"/api/files/{file_id}")
    assert verify_del.status_code == 404

def test_duplicate_detection():
    # Upload two files with identical content
    identical_bytes = b"IDENTICAL CONTENT FILE FOR DUPLICATE DETECTION TEST 123456"
    f1 = ("files", ("original_contract.txt", identical_bytes, "text/plain"))
    f2 = ("files", ("contract_backup.txt", identical_bytes, "text/plain"))
    
    upload_res = client.post("/api/files/upload", files=[f1, f2])
    assert upload_res.status_code == 200
    u1, u2 = upload_res.json()["uploaded"]

    dup_res = client.get("/api/duplicates")
    assert dup_res.status_code == 200
    data = dup_res.json()
    assert data["count"] > 0
    assert data["recoverable_bytes"] > 0
    
    # Clean up test files
    client.delete(f"/api/files/{u1['id']}")
    client.delete(f"/api/files/{u2['id']}")

def test_semantic_search():
    search_res = client.get("/api/search?q=college+project+report")
    assert search_res.status_code == 200
    data = search_res.json()
    assert data["count"] > 0
    first_result = data["results"][0]
    assert "file" in first_result
    assert "score" in first_result
    assert first_result["score"] >= 35

def test_similar_files():
    # Find any existing file
    files_res = client.get("/api/files")
    files = files_res.json()
    target_id = files[0]["id"]

    sim_res = client.get(f"/api/similar/{target_id}")
    assert sim_res.status_code == 200
    data = sim_res.json()
    assert data["target_file_id"] == target_id
    assert "similar" in data

def test_analytics_data():
    analytics_res = client.get("/api/analytics")
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert "category_distribution" in data
    assert "file_types" in data
    assert "upload_history" in data
    assert len(data["category_distribution"]) > 0

def test_settings_persistence():
    # Get settings
    get_res = client.get("/api/settings")
    assert get_res.status_code == 200

    # Update settings
    patch_res = client.patch("/api/settings", json={"accent": "cyan", "notifications": False})
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["accent"] == "cyan"
    assert data["notifications"] is False

    # Restore to aurora
    client.patch("/api/settings", json={"accent": "aurora", "notifications": True})

def test_ai_classifier_unit():
    cat, conf = classifier.classify("University examination algorithm syllabus lecture homework", "CS_101", "pdf")
    assert cat == "Educational"
    assert conf >= 75.0

    cat_rep, conf_rep = classifier.classify("Quarterly financial report audit metrics summary", "Q3_Report", "docx")
    assert cat_rep == "Reports"
    assert conf_rep >= 75.0

def test_text_extractor_unit():
    raw_txt = b"Hello world text extractor test content"
    extracted = extract_text_from_bytes(raw_txt, "test.txt", "txt")
    assert extracted == "Hello world text extractor test content"
