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
                        sh 'docker build -t registry.comp.ystv.co.uk/sports-scores/server -f Dockerfile.server .'
                    }
                }
                stage('Client') {
                    steps {
                        sh 'docker build -t registry.comp.ystv.co.uk/sports-scores/client -f Dockerfile.client .'
                    }
                }
            }
        }

        stage('Push') {
            steps {
                sh 'docker push registry.comp.ystv.co.uk/sports-scores/client'
                sh 'docker push registry.comp.ystv.co.uk/sports-scores/server'
            }
        }
    }
}