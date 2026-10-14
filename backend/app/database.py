import logging
import uuid
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings

logger = logging.getLogger("database")

class Database:
    def __init__(self):
        self._client: MongoClient | None = None
        self._db = None

    def connect(self):
        try:
            self._client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000
            )
            # Verify connection
            self._client.admin.command('ping')
            self._db = self._client[settings.DATABASE_NAME]
            self.init_indexes()
            logger.info(f"Connected successfully to MongoDB database: {settings.DATABASE_NAME}")
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            self._db = self._client[settings.DATABASE_NAME] if self._client else None

    def init_indexes(self):
        if self._db is None:
            return
        try:
            # Fix any legacy documents missing 'id'
            for coll_name in ["users", "files", "activities"]:
                coll = self._db[coll_name]
                for doc in coll.find({"id": None}):
                    generated_id = doc.get("userId") or doc.get("activityId") or doc.get("fileId") or str(doc["_id"])
                    coll.update_one({"_id": doc["_id"]}, {"$set": {"id": generated_id}})

            # Clean legacy username index if present
            try:
                self._db.users.drop_index("username_1")
            except Exception:
                pass

            # Users indexes
            self._db.users.create_index("email", unique=True)
            self._db.users.create_index("id", unique=True)

            # Files indexes
            self._db.files.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
            self._db.files.create_index([("user_id", ASCENDING), ("sha256", ASCENDING)])
            self._db.files.create_index([("user_id", ASCENDING), ("category", ASCENDING)])
            self._db.files.create_index("id", unique=True, sparse=True)

            # Activities indexes
            self._db.activities.create_index([("user_id", ASCENDING), ("date", DESCENDING)])
            self._db.activities.create_index("id", unique=True, sparse=True)

            # Settings indexes
            self._db.settings.create_index("user_id", unique=True, sparse=True)
            logger.info("MongoDB collections and indexes ensured.")
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")

    @property
    def db(self):
        if self._db is None:
            self.connect()
        return self._db

    @property
    def users(self):
        return self.db.users

    @property
    def files(self):
        return self.db.files

    @property
    def activities(self):
        return self.db.activities

    @property
    def settings(self):
        return self.db.settings

db = Database()
