import os
import logging
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

# Check if Cloudinary is configured
def is_cloudinary_configured() -> bool:
    return bool(
        settings.CLOUDINARY_CLOUD_NAME 
        and settings.CLOUDINARY_API_KEY 
        and settings.CLOUDINARY_API_SECRET
    )

def init_cloudinary():
    if is_cloudinary_configured():
        try:
            import cloudinary
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )
            logger.info("Cloudinary successfully initialized.")
        except Exception as e:
            logger.warning(f"Failed to configure Cloudinary: {e}")

# Initialize on module load
init_cloudinary()

def upload_image(file_bytes_or_path, folder: str = "fixmyroad/reports", public_id: Optional[str] = None) -> Optional[str]:
    """
    Uploads an image to Cloudinary if credentials are configured.
    Returns the HTTPS secure URL or None if Cloudinary is not configured.
    """
    if not is_cloudinary_configured():
        return None
        
    try:
        import cloudinary.uploader
        upload_result = cloudinary.uploader.upload(
            file_bytes_or_path,
            folder=folder,
            public_id=public_id,
            resource_type="image",
            overwrite=True
        )
        return upload_result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}. Falling back to local storage.")
        return None

