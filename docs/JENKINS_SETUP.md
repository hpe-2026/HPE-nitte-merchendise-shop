# Jenkins CI/CD Setup Guide for NITTE Merchandise Shop

## Quick Start

### Option 1: Automatic Setup (Recommended)
```bash
bash nitte-setup.sh --with-jenkins
```

Wait ~30 seconds for Jenkins to start. Then access: http://localhost:8080

### Option 2: Manual Setup
1. Ensure all core services are running:
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   docker compose -f monitoring/docker-compose.yml up -d
   ```

2. Create Docker network (if not exists):
   ```bash
   docker network create nitte-network
   ```

3. Start Jenkins:
   ```bash
   cd jenkins
   docker compose -f docker-compose-jenkins.yml up -d
   cd ..
   ```

4. Wait 30 seconds and access: http://localhost:8080

---

## Jenkins Configuration

### Access Jenkins
- **URL**: http://localhost:8080
- **Linux/Mac**: Jenkins starts without password in development mode
- **Windows**: May require initial setup (check logs for initial admin password)

### View Logs
```bash
docker compose -f jenkins/docker-compose-jenkins.yml logs -f
```

### Verify Jenkins is Running
```bash
curl http://localhost:8080/login
```

---

## Available Jenkins Pipelines

### 1. NITTE Build Pipeline
**Purpose**: Build Docker images and run tests

**What it does**:
- Clones the repository
- Builds backend Docker images
- Installs frontend dependencies
- Runs tests
- Pushes images to registry (optional)

**Location**: `/jenkins/Jenkinsfile`

### 2. NITTE Complete Pipeline (Advanced)
**Purpose**: Full CI/CD with deployment to Kubernetes

**What it does**:
- All steps from Build Pipeline
- Deploys to Kubernetes cluster
- Updates Helm charts
- Runs integration tests
- Notifies Slack on completion

**Location**: `/jenkins/Jenkinsfile-complete`

---

## Setting Up Your First Pipeline

### Step 1: Access Jenkins Dashboard
1. Open http://localhost:8080
2. You'll see empty Jenkins dashboard

### Step 2: Create New Job
1. Click "Create Job" or "New Item"
2. Enter job name: `NITTE-Merchandise-Build`
3. Choose job type: **Pipeline**
4. Click OK

### Step 3: Configure Pipeline
1. Scroll down to "Pipeline" section
2. In "Definition" dropdown, select "Pipeline script from SCM"
3. Configure SCM:
   - **SCM**: Git
   - **Repository URL**: `https://github.com/yourusername/nitte-merch-shop` (or your local repo)
   - **Branch**: `main` or `master`
   - **Script Path**: `jenkins/Jenkinsfile`

4. Click "Save"

### Step 4: Run Pipeline
1. Click "Build Now" on the job page
2. Monitor progress in "Build History"
3. Click build number to see console output

---

## Jenkins Pipeline Stages

### Build Stage
```
[1] Checkout Code
[2] Build Docker Images (node-backend, python-service, mongodb)
[3] Tag Images
[4] Push to Registry (optional)
```

### Test Stage
```
[1] Run Unit Tests
[2] Run Integration Tests
[3] Generate Coverage Reports
```

### Deploy Stage (if enabled)
```
[1] Authenticate with Kubernetes
[2] Deploy using Helm Charts
[3] Run Smoke Tests
[4] Verify Deployment
```

---

## Environment Variables for Jenkins

Jenkins can use these environment variables:

```bash
# Docker Registry
DOCKER_REGISTRY: docker.io
DOCKER_USERNAME: your-username
DOCKER_PASSWORD: your-password

# Kubernetes (for deployment)
KUBECONFIG: /var/jenkins_home/.kube/config
KUBE_CONTEXT: docker-desktop

# Slack Notifications (optional)
SLACK_WEBHOOK: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL: #deployments
```

### Set Jenkins Credentials
1. Go to Jenkins Dashboard
2. Click "Manage Jenkins" -> "Manage Credentials"
3. Click "System" -> "Global Credentials"
4. Click "Add Credentials"
5. Enter your Docker hub/registry credentials

---

## Running Tests in Jenkins

### Enable Test Reports
In your `Jenkinsfile`, add:

```groovy
stage('Tests') {
    steps {
        script {
            // Run tests
            sh 'cd node-backend && npm test'
            sh 'cd python-service && pytest'
        }
    }
    post {
        always {
            junit 'test-results/**/*.xml'
            publishHTML(reportDir: 'coverage', reportFiles: 'index.html')
        }
    }
}
```

---

## Docker Integration

Jenkins uses Docker to:
1. Build service images
2. Run tests in containers
3. Push to registry
4. Deploy to Kubernetes

### Configure Docker Socket
Jenkins automatically mounts Docker socket:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

This allows Jenkins to access Docker daemon.

---

## Webhook Integration (Optional)

### GitHub Webhook Setup
1. Go to your GitHub repository
2. Settings -> Webhooks -> Add webhook
3. **Payload URL**: `http://your-jenkins-url:8080/github-webhook/`
4. **Content type**: `application/json`
5. **Events**: Push events
6. Click "Add webhook"

Now Jenkins will automatically build when you push code!

### GitLab Webhook Setup
1. Go to your GitLab project
2. Settings -> Webhooks
3. **URL**: `http://your-jenkins-url:8080/gitlab/build`
4. Check "Push events"
5. Click "Add webhook"

---

## Monitoring Jenkins

### Jenkins Metrics in Prometheus
Jenkins exposes metrics at: `http://localhost:8080/metrics`

Add to Prometheus:
```yaml
scrape_configs:
  - job_name: 'jenkins'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
```

### View in Grafana
1. Go to Grafana: http://localhost:3001
2. Add Jenkins as data source
3. Import Jenkins dashboard ID: 9964

---

## Troubleshooting

### Jenkins Won't Start
**Check logs**:
```bash
docker compose -f jenkins/docker-compose-jenkins.yml logs -f
```

**Common fixes**:
```bash
# Restart Jenkins
docker compose -f jenkins/docker-compose-jenkins.yml restart

# Check network exists
docker network create nitte-network

# Check port is free
lsof -i :8080
```

### Build Fails
1. Check Jenkins logs
2. Verify Docker is running
3. Check credentials are set
4. Run build with verbose output

### Docker Commands Fail in Jenkins
**Fix**: Ensure Docker socket is mounted
```bash
docker compose -f jenkins/docker-compose-jenkins.yml exec jenkins ls -la /var/run/docker.sock
```

### Kubernetes Deployment Fails
1. Ensure kubeconfig is valid
2. Check Kubernetes cluster is accessible
3. Verify serviceaccount has permissions
4. Check disk space in cluster

---

## Complete Pipeline Example

Here's a basic Jenkinsfile for this project:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/yourusername/nitte-merch-shop.git'
            }
        }
        
        stage('Build') {
            steps {
                script {
                    sh 'docker compose build'
                }
            }
        }
        
        stage('Test') {
            steps {
                script {
                    sh 'docker compose -f docker-compose.yml run --rm node-backend npm test'
                    sh 'docker compose -f docker-compose.yml run --rm python-service pytest'
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh 'docker-compose push'
                    sh 'kubectl apply -f k8s/'
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Build succeeded!'
        }
        failure {
            echo 'Build failed!'
        }
    }
}
```

---

## Next Steps

1. **Configure credentials**: Add Docker and Git credentials
2. **Set up webhooks**: Enable auto-build on code push
3. **Add notifications**: Slack, email, or PagerDuty
4. **Monitor builds**: View metrics in Prometheus/Grafana
5. **Scale deployments**: Deploy to production cluster
6. **Set up CD**: Enable auto-deployment on main branch

---

## Useful Jenkins Plugins

Pre-installed in this setup:
- Pipeline (declarative & scripted)
- GitHub integration
- Docker plugin
- Kubernetes plugin
- Prometheus metrics
- AnsiColor (colored logs)

### Install More Plugins
1. Jenkins Dashboard -> Manage Jenkins
2. Plugin Manager
3. Search for plugin
4. Click "Install without restart"

Popular plugins:
- Blue Ocean (better UI)
- Email Extension
- Slack Notification
- SonarQube Scanner
- Artifactory

---

## Performance Tuning

### Increase Jenkins Memory
Edit `jenkins/docker-compose-jenkins.yml`:
```yaml
environment:
  JAVA_OPTS: "-Xmx2g -Xms1g"
```

### Configure Executors
1. Manage Jenkins -> Configure System
2. Set "# of executors" to match CPU cores
3. Click Save

### Cleanup Old Builds
1. Job Configuration -> Log Rotation
2. Set "Keep builds for X days"
3. Set "Keep X builds"

---

## Summary

Your NITTE Merchandise Shop now has:
- Automated CI/CD pipeline
- Docker image building
- Test automation
- Optional Kubernetes deployment
- Monitoring integration
- Webhook auto-building

To start using it:
```bash
bash nitte-setup.sh --with-jenkins
# Access at http://localhost:8080
```

Enjoy automated deployments!
