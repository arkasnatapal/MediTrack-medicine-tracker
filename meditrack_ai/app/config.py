import os
import sys
import platform
import subprocess
from pydantic_settings import BaseSettings

def inspect_hardware():
    """
    Auto-detect hardware resources on the host machine.
    Returns specs and model recommendations.
    """
    os_name = f"{platform.system()} {platform.release()}"
    cpu_cores = os.cpu_count() or 4
    ram_gb = 16.0 # Default fallback estimation
    
    # Try estimating RAM on Windows / Unix
    try:
        if platform.system() == "Windows":
            cmd = 'powershell -Command "(Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize"'
            res = subprocess.check_output(cmd, shell=True).decode().strip()
            if res.isdigit():
                ram_gb = round(int(res) / (1024 * 1024), 2)
    except Exception:
        pass

    gpu_name = None
    vram_gb = 0.0
    cuda_available = False

    try:
        cmd = "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits"
        res = subprocess.check_output(cmd, shell=True).decode().strip()
        if res:
            parts = res.split(',')
            gpu_name = parts[0].strip()
            if len(parts) > 1 and parts[1].strip().isdigit():
                vram_gb = round(int(parts[1].strip()) / 1024, 2)
                cuda_available = True
    except Exception:
        pass

    # Model recommendation based on detected specs
    if cuda_available and vram_gb >= 4.0:
        recommended_model = "Qwen2.5-1.5B-Instruct / MedGemma-2B (Quantized GGUF / HF)"
        recommended_provider = "local"
    elif ram_gb >= 8.0:
        recommended_model = "TinyLlama-1.1B / Qwen-0.5B (CPU Quantized)"
        recommended_provider = "local"
    else:
        recommended_model = "Safety Engine Fallback Mode"
        recommended_provider = "fallback"

    return {
        "os": os_name,
        "cpu_cores": cpu_cores,
        "ram_gb": ram_gb,
        "gpu_name": gpu_name or "CPU / Integrated Graphics",
        "vram_gb": vram_gb,
        "cuda_available": cuda_available,
        "recommended_model": recommended_model,
        "recommended_provider": recommended_provider
    }


class Settings(BaseSettings):
    APP_NAME: str = "MediTrack AI Digital Triage Service"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", 8001))
    
    # Model Provider Configuration
    AI_MODEL_PROVIDER: str = os.getenv("AI_MODEL_PROVIDER", "local")  # local, gemini, openai, fallback
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "Qwen/Qwen2.5-1.5B-Instruct")
    AI_MODEL_PATH: str = os.getenv("AI_MODEL_PATH", "")
    AI_DEVICE: str = os.getenv("AI_DEVICE", "auto") # auto, cuda, cpu
    
    # Features
    RAG_ENABLED: bool = os.getenv("RAG_ENABLED", "true").lower() == "true"
    SAFETY_ENGINE_STRICT: bool = True
    
    # Region & Emergency
    DEFAULT_REGION: str = os.getenv("DEFAULT_REGION", "IN")
    EMERGENCY_NUMBERS: dict = {
        "IN": {"ambulance": "108", "national_emergency": "112"},
        "US": {"ambulance": "911", "national_emergency": "911"},
        "GLOBAL": {"ambulance": "112", "national_emergency": "112"}
    }

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
hardware_specs = inspect_hardware()
