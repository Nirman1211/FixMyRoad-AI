import os
os.environ["TESTING"] = "1"
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.security import get_password_hash, create_access_token
from app.models.user import User, UserRole

# Use temporary SQLite file for testing
TEST_DB_FILE = "test_fixmyroad.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test users
    admin = User(
        email="test_admin@fixmyroad.org",
        hashed_password=get_password_hash("AdminPass123"),
        first_name="Test",
        last_name="Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    officer = User(
        email="test_officer@fixmyroad.org",
        hashed_password=get_password_hash("OfficerPass123"),
        first_name="Test",
        last_name="Officer",
        role=UserRole.OFFICER,
        is_active=True
    )
    citizen = User(
        email="test_citizen@fixmyroad.org",
        hashed_password=get_password_hash("CitizenPass123"),
        first_name="Test",
        last_name="Citizen",
        role=UserRole.CITIZEN,
        is_active=True
    )
    db.add_all([admin, officer, citizen])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers(db_session):
    admin = db_session.query(User).filter(User.role == UserRole.ADMIN).first()
    token = create_access_token(subject=admin.id, role=admin.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def officer_headers(db_session):
    officer = db_session.query(User).filter(User.role == UserRole.OFFICER).first()
    token = create_access_token(subject=officer.id, role=officer.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def citizen_headers(db_session):
    citizen = db_session.query(User).filter(User.role == UserRole.CITIZEN).first()
    token = create_access_token(subject=citizen.id, role=citizen.role.value)
    return {"Authorization": f"Bearer {token}"}
