import uuid
import logging
from datetime import datetime, timezone
from google.cloud import firestore as gcp_firestore
from google.api_core.retry import Retry
from .firebase import get_db

logger = logging.getLogger(__name__)

FS_TIMEOUT = 10  # per-RPC deadline, seconds
FS_RETRY = Retry(deadline=FS_TIMEOUT, maximum=3.0, multiplier=2.0)


def gen_id():
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc)


def doc_to_dict(doc):
    if doc is None or not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def add_item(collection, data, doc_id=None):
    try:
        ref = get_db().collection(collection).document(doc_id or gen_id())
        ref.set(data, merge=True, timeout=FS_TIMEOUT, retry=FS_RETRY)
        return ref.id
    except Exception as e:
        logger.exception("Firestore add failed in %s", collection)
        raise


def get_item(collection, doc_id):
    try:
        doc = get_db().collection(collection).document(doc_id).get(timeout=FS_TIMEOUT, retry=FS_RETRY)
        return doc_to_dict(doc)
    except Exception as e:
        logger.exception("Firestore get failed in %s", collection)
        raise


def query_items(collection, field, op, value, limit=None):
    try:
        q = get_db().collection(collection).where(field, op, value)
        if limit:
            q = q.limit(limit)
        return [doc_to_dict(d) for d in q.stream(timeout=FS_TIMEOUT, retry=FS_RETRY)]
    except Exception as e:
        logger.exception("Firestore query failed in %s", collection)
        raise


def query_first(collection, field, op, value):
    try:
        docs = list(get_db().collection(collection).where(field, op, value).limit(1).stream(timeout=FS_TIMEOUT, retry=FS_RETRY))
        return doc_to_dict(docs[0]) if docs else None
    except Exception as e:
        logger.exception("Firestore query_first failed in %s", collection)
        raise


def query_in(collection, field, values, limit=30):
    values = [v for v in values if v]
    if not values:
        return []
    results = []
    # Firestore "in" queries are limited to 10 values (some SDKs 30);
    # chunk to avoid exceeding the limit.
    chunks = [values[i:i + 10] for i in range(0, len(values), 10)]
    for chunk in chunks:
        try:
            q = get_db().collection(collection).where(field, "in", chunk)
            results.extend(doc_to_dict(d) for d in q.stream(timeout=FS_TIMEOUT, retry=FS_RETRY))
        except Exception as e:
            logger.exception("Firestore query_in failed in %s", collection)
            raise
    return results


def update_item(collection, doc_id, data):
    try:
        get_db().collection(collection).document(doc_id).update(data, timeout=FS_TIMEOUT, retry=FS_RETRY)
    except Exception as e:
        logger.exception("Firestore update failed in %s", collection)
        raise


def delete_item(collection, doc_id):
    try:
        get_db().collection(collection).document(doc_id).delete(timeout=FS_TIMEOUT, retry=FS_RETRY)
    except Exception as e:
        logger.exception("Firestore delete failed in %s", collection)
        raise


def list_collection(collection, limit=None, order_by=None, direction="ASCENDING"):
    try:
        q = get_db().collection(collection)
        if order_by:
            q = q.order_by(order_by, direction=direction)
        if limit:
            q = q.limit(limit)
        return [doc_to_dict(d) for d in q.stream(timeout=FS_TIMEOUT, retry=FS_RETRY)]
    except Exception as e:
        logger.exception("Firestore list_collection failed in %s", collection)
        raise


def delete_collection_docs(collection, field, value, limit=100):
    try:
        q = get_db().collection(collection).where(field, "==", value).limit(limit)
        docs = list(q.stream(timeout=FS_TIMEOUT, retry=FS_RETRY))
        for d in docs:
            d.reference.delete(timeout=FS_TIMEOUT, retry=FS_RETRY)
        return len(docs)
    except Exception as e:
        logger.exception("Firestore delete_collection_docs failed in %s", collection)
        raise


class UserRecord:
    def __init__(self, data):
        data = dict(data or {})
        self._user_id = data.pop("user_id", None)
        self._email = data.pop("email", "")
        self._name = data.pop("name", "")
        self._role = data.pop("role", "student")
        self.__dict__.update(data)

    @property
    def user_id(self):
        return self._user_id

    @property
    def email(self):
        return self._email

    @property
    def name(self):
        return self._name

    @property
    def role(self):
        return self._role


def get_user_by_uid(uid):
    return query_first("users", "uid", "==", uid)


def get_student_by_uid(uid):
    return query_first("students", "user_id", "==", uid)


def get_student_by_userid(user_id):
    return query_first("students", "user_id", "==", user_id)


def get_faculty_by_userid(user_id):
    return query_first("faculties", "user_id", "==", user_id)
