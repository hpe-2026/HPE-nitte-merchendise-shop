FROM jenkins/jenkins:lts

USER root

# Install Docker CLI
RUN apt-get update && apt-get install -y \
    docker.io \
    docker-compose \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Add Jenkins user to docker group
RUN usermod -aG docker jenkins

# Install Jenkins plugins
RUN jenkins-plugin-cli --plugins \
    docker-pipeline:563.vd602cc813f51 \
    kubernetes:1.31.3 \
    kubernetes-credentials-provider:0.9 \
    docker:1.2.3 \
    git:5.0.0 \
    pipeline-model-definition:2.2.5 \
    slack:651.v303e3d1c3340 \
    emailext:2.96 \
    prometheus:2.2.0 \
    timestamper:1.17 \
    log-parser:2.1

USER jenkins
