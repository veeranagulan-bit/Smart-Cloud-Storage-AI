import os
import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from app.config import settings
from app.database import db
from app.auth import hash_password
from app.storage import get_storage
from app.ai.classifier import classifier
from app.ai.embeddings import embedding_engine

def d(days_ago: int, h: int = 10) -> str:
    now = datetime(2026, 10, 14, h, 0, 0, tzinfo=timezone.utc)
    target = now - timedelta(days=days_ago)
    return target.isoformat()

MB = 1024 * 1024

SEED_DEFINITIONS = [
    {
        "id": "f1",
        "name": "College Project Report - Final",
        "ext": "pdf",
        "kind": "document",
        "size": int(4.2 * MB),
        "date": d(0, 9),
        "category": "Educational",
        "tags": ["college", "project", "report"],
        "favorite": True,
        "content_text": "Final Year Major Project Report on Smart Cloud Storage AI. Abstract: This project develops an intelligent cloud storage system with automated NLP document classification and high-dimensional semantic search. Supervised by Department of Computer Science and Engineering."
    },
    {
        "id": "f2",
        "name": "Machine Learning Notes",
        "ext": "docx",
        "kind": "document",
        "size": int(1.8 * MB),
        "date": d(1),
        "category": "Educational",
        "tags": ["machine learning", "ai", "notes"],
        "favorite": False,
        "content_text": "Comprehensive lecture notes on Supervised Learning, Support Vector Machines, Gradient Boosting, Backpropagation, and Deep Convolutional Neural Networks for image classification."
    },
    {
        "id": "f3",
        "name": "Q3 Revenue Analysis",
        "ext": "xlsx",
        "kind": "spreadsheet",
        "size": int(2.4 * MB),
        "date": d(1, 14),
        "category": "Business",
        "tags": ["finance", "revenue", "quarterly"],
        "favorite": False,
        "content_text": "Q3 Financial Statement and Revenue Breakdown. Total Gross Margin: $1.42M. Operating Expenses: $620K. Net Profit Margin increased by 18.4% quarter-over-quarter across European and North American markets."
    },
    {
        "id": "f4",
        "name": "Beach Sunset",
        "ext": "jpg",
        "kind": "image",
        "size": int(6.1 * MB),
        "date": d(2),
        "category": "Images",
        "tags": ["photo", "travel"],
        "favorite": True,
        "content_text": "Photograph taken at sunset on the Pacific coastline, golden hour lighting."
    },
    {
        "id": "f5",
        "name": "Beach Sunset (copy)",
        "ext": "jpg",
        "kind": "image",
        "size": int(6.1 * MB),
        "date": d(2, 15),
        "category": "Images",
        "tags": ["photo", "travel"],
        "favorite": False,
        "duplicate_of": "f4",
        "content_text": "Photograph taken at sunset on the Pacific coastline, golden hour lighting."
    },
    {
        "id": "f6",
        "name": "Neural Networks Lecture",
        "ext": "mp4",
        "kind": "video",
        "size": int(412 * MB),
        "date": d(3),
        "category": "Educational",
        "tags": ["deep learning", "lecture", "ai"],
        "favorite": False,
        "content_text": "Video lecture recording on multi-layer perceptrons, backpropagation, and recurrent architectures."
    },
    {
        "id": "f7",
        "name": "Annual Report 2025",
        "ext": "pdf",
        "kind": "document",
        "size": int(8.7 * MB),
        "date": d(4),
        "category": "Reports",
        "tags": ["annual", "report", "company"],
        "favorite": False,
        "content_text": "Annual Corporate Performance Report for Fiscal Year 2025. Key accomplishments, audited balance sheets, corporate governance review, sustainability initiatives and long term growth forecasts."
    },
    {
        "id": "f8",
        "name": "Annual Report 2025 (copy)",
        "ext": "pdf",
        "kind": "document",
        "size": int(8.7 * MB),
        "date": d(9),
        "category": "Reports",
        "tags": ["annual", "report", "company"],
        "favorite": False,
        "duplicate_of": "f7",
        "content_text": "Annual Corporate Performance Report for Fiscal Year 2025. Key accomplishments, audited balance sheets, corporate governance review, sustainability initiatives and long term growth forecasts."
    },
    {
        "id": "f9",
        "name": "Annual Report 2024",
        "ext": "pdf",
        "kind": "document",
        "size": int(7.9 * MB),
        "date": d(40),
        "category": "Reports",
        "tags": ["annual", "report", "company"],
        "favorite": False,
        "content_text": "Annual Corporate Performance Report for Fiscal Year 2024. Retrospective audit, milestones, executive compensation, shareholder dividend disclosures."
    },
    {
        "id": "f10",
        "name": "Client Proposal - Nimbus",
        "ext": "docx",
        "kind": "document",
        "size": int(12.3 * MB),
        "date": d(5),
        "category": "Business",
        "tags": ["proposal", "client", "pitch"],
        "favorite": False,
        "content_text": "Enterprise Cloud Architecture Modernization Proposal prepared for Nimbus Technologies. Scope includes zero-trust security model, AWS migration, and automated Kubernetes CI/CD."
    },
    {
        "id": "f11",
        "name": "Data Structures Assignment",
        "ext": "pdf",
        "kind": "document",
        "size": int(0.9 * MB),
        "date": d(6),
        "category": "Educational",
        "tags": ["college", "assignment", "algorithms"],
        "favorite": False,
        "content_text": "CS201 Homework Assignment: Implementation and complexity analysis of Red-Black Trees, Min-Heaps, Dijkstra Shortest Path, and Disjoint Set Union operations."
    },
    {
        "id": "f12",
        "name": "product_mockup_v2",
        "ext": "png",
        "kind": "image",
        "size": int(3.3 * MB),
        "date": d(7),
        "category": "Images",
        "tags": ["design", "mockup"],
        "favorite": False,
        "content_text": "High-fidelity UI mockup for user profile settings and dashboard widgets."
    },
    {
        "id": "f13",
        "name": "product_mockup_v3",
        "ext": "png",
        "kind": "image",
        "size": int(3.5 * MB),
        "date": d(7, 16),
        "category": "Images",
        "tags": ["design", "mockup"],
        "favorite": False,
        "content_text": "High-fidelity UI mockup v3 with refined glassmorphism styling and dark mode accents."
    },
    {
        "id": "f14",
        "name": "Podcast Episode 12",
        "ext": "mp3",
        "kind": "audio",
        "size": int(48 * MB),
        "date": d(8),
        "category": "Others",
        "tags": ["podcast", "audio"],
        "favorite": False,
        "content_text": "Audio discussion with AI researchers regarding foundation models and vector databases."
    },
    {
        "id": "f15",
        "name": "Thesis Draft - Computer Vision",
        "ext": "docx",
        "kind": "document",
        "size": int(2.9 * MB),
        "date": d(10),
        "category": "Educational",
        "tags": ["thesis", "computer vision", "ai", "college"],
        "favorite": False,
        "content_text": "Master's Thesis Draft: Real-time Object Detection and Semantic Segmentation in Edge Computing Environments Using Lightweight Vision Transformers."
    },
    {
        "id": "f16",
        "name": "Invoice #4021",
        "ext": "pdf",
        "kind": "document",
        "size": int(0.2 * MB),
        "date": d(11),
        "category": "Business",
        "tags": ["invoice", "finance"],
        "favorite": False,
        "content_text": "Invoice #4021. Billed to: Apex Solutions Inc. Services rendered: Software Development & Infrastructure Support. Total Amount Due: $4,850.00. Payment terms: Net 30."
    },
    {
        "id": "f17",
        "name": "Invoice #4021 (copy)",
        "ext": "pdf",
        "kind": "document",
        "size": int(0.2 * MB),
        "date": d(12),
        "category": "Business",
        "tags": ["invoice", "finance"],
        "favorite": False,
        "duplicate_of": "f16",
        "content_text": "Invoice #4021. Billed to: Apex Solutions Inc. Services rendered: Software Development & Infrastructure Support. Total Amount Due: $4,850.00. Payment terms: Net 30."
    },
    {
        "id": "f18",
        "name": "Marketing Performance Q3",
        "ext": "pdf",
        "kind": "document",
        "size": int(3.1 * MB),
        "date": d(13),
        "category": "Reports",
        "tags": ["marketing", "report", "quarterly"],
        "favorite": False,
        "content_text": "Q3 Marketing Analytics Report: User acquisition, CAC, conversion funnels, organic SEO traffic growth, social impressions, and campaign ROI summary."
    },
    {
        "id": "f19",
        "name": "source-code-backup",
        "ext": "zip",
        "kind": "archive",
        "size": int(220 * MB),
        "date": d(15),
        "category": "Others",
        "tags": ["backup", "code"],
        "favorite": False,
        "content_text": "Compressed archive of production web application source code and deployment scripts."
    },
    {
        "id": "f20",
        "name": "Team Offsite Photos",
        "ext": "zip",
        "kind": "archive",
        "size": int(640 * MB),
        "date": d(18),
        "category": "Images",
        "tags": ["photo", "team"],
        "favorite": False,
        "content_text": "High resolution archive of engineering team offsite retreat and hackathon."
    },
    {
        "id": "f21",
        "name": "Reinforcement Learning Paper",
        "ext": "pdf",
        "kind": "document",
        "size": int(1.4 * MB),
        "date": d(20),
        "category": "Educational",
        "tags": ["machine learning", "research", "ai"],
        "favorite": False,
        "content_text": "Research paper: Proximal Policy Optimization Algorithms with Generalized Advantage Estimation in Continuous Control Environments."
    },
    {
        "id": "f22",
        "name": "train_model",
        "ext": "py",
        "kind": "code",
        "size": int(0.03 * MB),
        "date": d(21),
        "category": "Others",
        "tags": ["python", "machine learning", "code"],
        "favorite": False,
        "content_text": "import torch\nimport torch.nn as nn\n# Model training script with PyTorch and DataLoader"
    },
    {
        "id": "f23",
        "name": "Resume - 2026",
        "ext": "pdf",
        "kind": "document",
        "size": int(0.3 * MB),
        "date": d(25),
        "category": "Documents",
        "tags": ["resume", "career"],
        "favorite": True,
        "content_text": "Senior Full-Stack & AI Software Engineer Resume. Experience with Python, FastAPI, React, TypeScript, MongoDB, Cloud Storage, and NLP Embeddings."
    },
    {
        "id": "f24",
        "name": "Lease Agreement",
        "ext": "pdf",
        "kind": "document",
        "size": int(1.1 * MB),
        "date": d(30),
        "category": "Documents",
        "tags": ["legal", "home"],
        "favorite": False,
        "content_text": "Standard Residential Lease Agreement for rental property. Term: 12 months. Monthly rent, security deposit terms, maintenance covenants, and legal jurisdiction."
    }
]

def seed():
    print("Connecting to database...")
    db.connect()

    demo_user_id = "user_demo_2026"
    demo_email = "demo@antigravity.ai"

    # Ensure demo user exists
    existing_user = db.users.find_one({"email": demo_email})
    hashed = hash_password("Demo123!")
    if not existing_user:
        db.users.insert_one({
            "id": demo_user_id,
            "email": demo_email,
            "name": "Demo User",
            "password_hash": hashed,
            "created_at": d(60),
            "storage_quota": settings.STORAGE_QUOTA_BYTES
        })
        print(f"Created demo user: {demo_email}")
    else:
        demo_user_id = existing_user.get("id") or existing_user.get("userId") or str(existing_user.get("_id"))
        db.users.update_one(
            {"_id": existing_user["_id"]},
            {"$set": {"id": demo_user_id, "password_hash": hashed}}
        )
        print(f"Demo user exists with ID: {demo_user_id}")

    # Ensure user settings
    db.settings.update_one(
        {"user_id": demo_user_id},
        {"$set": {
            "user_id": demo_user_id,
            "accent": "aurora",
            "motion": "full",
            "density": "comfortable",
            "notifications": True
        }},
        upsert=True
    )

    # Storage setup
    storage = get_storage()

    # Pre-calculate content bytes for duplicate matching
    base_contents = {}

    print("Seeding sample documents...")
    for item in SEED_DEFINITIONS:
        fid = item["id"]
        # Check if already in database
        existing_file = db.files.find_one({"id": fid, "user_id": demo_user_id})
        if existing_file:
            continue

        dup_source = item.get("duplicate_of")
        if dup_source and dup_source in base_contents:
            raw_bytes = base_contents[dup_source]
        else:
            # Create synthetic representative file content bytes
            body = (item.get("content_text", "") + "\n") * 50
            raw_bytes = body.encode("utf-8")
            base_contents[fid] = raw_bytes

        sha256 = hashlib.sha256(raw_bytes).hexdigest()
        filename = f"{item['name']}.{item['ext']}"

        # Save to real storage vault
        storage_key = storage.save_file(
            file_id=fid,
            filename=filename,
            content=raw_bytes,
            user_id=demo_user_id
        )

        # Generate embedding
        embed_text = f"{item['name']} {item['category']} {item['content_text']}"
        embedding = embedding_engine.embed_text(embed_text)

        # Classify
        pred_cat, conf = classifier.classify(item['content_text'], item['name'], item['ext'])

        record = {
            "id": fid,
            "user_id": demo_user_id,
            "name": item["name"],
            "ext": item["ext"],
            "kind": item["kind"],
            "size": item["size"],
            "date": item["date"],
            "category": item["category"],
            "confidence": conf,
            "tags": item["tags"],
            "favorite": item.get("favorite", False),
            "hash": sha256,
            "sha256": sha256,
            "storage_key": storage_key,
            "extracted_text": item.get("content_text", "")[:10000],
            "textPreview": item.get("content_text", "")[:4000],
            "embedding": embedding,
            "created_at": item["date"],
            "updated_at": item["date"]
        }

        db.files.insert_one(record)

    # Seed activities if empty
    act_count = db.activities.count_documents({"user_id": demo_user_id})
    if act_count < 5:
        sample_activities = [
            {"id": "a1", "type": "upload", "text": "Uploaded College Project Report - Final.pdf", "date": d(0, 9)},
            {"id": "a2", "type": "classify", "text": "AI classification: Machine Learning Notes → Educational (96%)", "date": d(1, 11)},
            {"id": "a3", "type": "index", "text": "Semantic index refreshed with all-MiniLM-L6-v2 embeddings", "date": d(1, 12)},
            {"id": "a4", "type": "duplicate", "text": "Duplicate scan flagged Beach Sunset (copy).jpg", "date": d(2, 16)},
            {"id": "a5", "type": "search", "text": "Searched “annual company reports”", "date": d(3, 10)},
            {"id": "a6", "type": "upload", "text": "Uploaded Neural Networks Lecture.mp4", "date": d(3, 9)},
            {"id": "a7", "type": "rename", "text": "Renamed product_mockup_v2.png", "date": d(7, 17)},
        ]
        for a in sample_activities:
            a["user_id"] = demo_user_id
            db.activities.update_one({"id": a["id"]}, {"$setOnInsert": a}, upsert=True)

    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
