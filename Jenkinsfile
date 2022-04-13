pipeline {
    agent {
        label 'docker'
    }
    
    stages {
        stage('Download Dependencies') {
            steps {
                sh 'docker build -f Dockerfile.common .'
            }
        }

        stage('Build') {
            parallel {
                stage('Server') {
                    steps {
                        sh "docker build -t registry.comp.ystv.co.uk/sports-scores/server:${env.BUILD_NUMBER} -f Dockerfile.server ."
                    }
                }
                stage('Client') {
                    steps {
                        sh "docker build -t registry.comp.ystv.co.uk/sports-scores/client:${env.BUILD_NUMBER} -f Dockerfile.client ."
                    }
                }
                stage('Bundle') {
                    steps {
                        sh "docker build -t registry.comp.ystv.co.uk/sports-scores/bundle:${env.BUILD_NUMBER} -f Dockerfile.bundle ."
                    }
                }
            }
        }

        stage('Push') {
            steps {
                withDockerRegistry(credentialsId: 'docker-registry', url: 'https://registry.comp.ystv.co.uk') {
                    sh "docker push registry.comp.ystv.co.uk/sports-scores/client:${env.BUILD_NUMBER}"
                    sh "docker push registry.comp.ystv.co.uk/sports-scores/server:${env.BUILD_NUMBER}"
                    sh "docker push registry.comp.ystv.co.uk/sports-scores/bundle:${env.BUILD_NUMBER}"
                    sh "docker tag registry.comp.ystv.co.uk/sports-scores/client:${env.BUILD_NUMBER} registry.comp.ystv.co.uk/sports-scores/client:latest"
                    sh "docker tag registry.comp.ystv.co.uk/sports-scores/server:${env.BUILD_NUMBER} registry.comp.ystv.co.uk/sports-scores/server:latest"
                    sh "docker tag registry.comp.ystv.co.uk/sports-scores/bundle:${env.BUILD_NUMBER} registry.comp.ystv.co.uk/sports-scores/bundle:latest"
                    sh 'docker push registry.comp.ystv.co.uk/sports-scores/client:latest'
                    sh 'docker push registry.comp.ystv.co.uk/sports-scores/server:latest'
                    sh 'docker push registry.comp.ystv.co.uk/sports-scores/bundle:latest'
                }
            }
        }

        stage('Deploy to development') {
            when {
                branch 'main'
            }
            steps {
                build job: 'Deploy Nomad Job', parameters: [
                    string(name: 'JOB_FILE', value: 'sports-graphics.nomad'),
                    text(name: 'TAG_REPLACEMENTS', value: "registry.comp.ystv.co.uk/sports-scores/server:${env.BUILD_NUMBER} registry.comp.ystv.co.uk/sports-scores/client:${env.BUILD_NUMBER}")
                ]
            }
        }
    }
}