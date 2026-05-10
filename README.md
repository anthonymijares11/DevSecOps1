# Secure App - Advanced DevSecOps Pipeline

This repository demonstrates an advanced GitHub Actions-based DevSecOps pipeline enforcing strict security gates, dependency scanning, container scanning, and artifact provenance.

## Security Practices Implemented
* **SAST & Secret Scanning:** Semgrep enforces that no hardcoded credentials exist.
* **SCA (Software Composition Analysis):** Trivy scans the `requirements.txt` for vulnerable dependencies.
* **Secure Containerization:** The Dockerfile utilizes a multi-stage build and drops privileges to a non-root user (`appuser`).
* **Container Vulnerability Scanning:** The built image is analyzed by Trivy before it is considered viable.

## Advanced Features
* **Software Bill of Materials (SBOM):** Generates a CycloneDX SBOM for full supply-chain transparency.
* **Artifact Provenance:** Uploads scan results and SBOMs as auditable pipeline artifacts.
* **Job Dependencies:** Enforces that images are only built if security scans pass.