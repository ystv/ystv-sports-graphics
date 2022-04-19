def imageNamePrefix = ''
pipeline {
    agent {
        label 'docker'
    }

    environment {
        DOCKER_BUILDKIT = "1"
    }
    
    stages {
        stage('Prepare') {
            steps {
                script {
                    if (env.BRANCH_NAME != 'main') {
                        imageNamePrefix = "${env.BRANCH_NAME}-"
                    }
                }
            }
        }
        stage('Download Dependencies') {
            steps {
                sh 'docker build -f Dockerfile.common .'
            }
        }
        stage('Build Images') {
            parallel {
                // bundle uses a different base image because its builds are done inside of NodeCG,
                // so it can't take advantage of the Dockerfile.common trick
                stage('Bundle') {
                    steps {
                        withDockerRegistry(credentialsId: 'docker-registry', url: 'https://registry.comp.ystv.co.uk') {
                            sh "docker build --build-arg GIT_REV=${env.GIT_COMMIT} -t registry.comp.ystv.co.uk/sports-scores/bundle:${imageNamePrefix}${env.BUILD_NUMBER} -f Dockerfile.bundle ."
                        }
                    }
                }
                stage('Server') {
                    steps {
                        sh "docker build --build-arg GIT_REV=${env.GIT_COMMIT} -t registry.comp.ystv.co.uk/sports-scores/server:${imageNamePrefix}${env.BUILD_NUMBER} -f Dockerfile.server ."
                    }
                }
                stage('Client') {
                    steps {
                        sh "docker build --build-arg GIT_REV=${env.GIT_COMMIT} -t registry.comp.ystv.co.uk/sports-scores/client:${imageNamePrefix}${env.BUILD_NUMBER} -f Dockerfile.client ."
                    }
                }
            }
        }

        stage('Push') {
            steps {
                withDockerRegistry(credentialsId: 'docker-registry', url: 'https://registry.comp.ystv.co.uk') {
                    sh "docker push registry.comp.ystv.co.uk/sports-scores/client:${imageNamePrefix}${env.BUILD_NUMBER}"
                    sh "docker push registry.comp.ystv.co.uk/sports-scores/server:${imageNamePrefix}${env.BUILD_NUMBER}"
                    sh "docker push registry.comp.ystv.co.uk/sports-scores/bundle:${imageNamePrefix}${env.BUILD_NUMBER}"
                    script {
                        if (env.BRANCH_NAME == 'main') {
                            sh "docker tag registry.comp.ystv.co.uk/sports-scores/client:${imageNamePrefix}${env.BUILD_NUMBER} registry.comp.ystv.co.uk/sports-scores/client:latest"
                            sh "docker tag registry.comp.ystv.co.uk/sports-scores/server:${imageNamePrefix}${env.BUILD_NUMBER} registry.comp.ystv.co.uk/sports-scores/server:latest"
                            sh "docker tag registry.comp.ystv.co.uk/sports-scores/bundle:${imageNamePrefix}${env.BUILD_NUMBER} registry.comp.ystv.co.uk/sports-scores/bundle:latest"
                            sh 'docker push registry.comp.ystv.co.uk/sports-scores/client:latest'
                            sh 'docker push registry.comp.ystv.co.uk/sports-scores/server:latest'
                            sh 'docker push registry.comp.ystv.co.uk/sports-scores/bundle:latest'
                        }
                    }
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
                build job: 'Deploy Nomad Job', parameters: [
                    string(name: 'JOB_FILE', value: 'sports-graphics-bundle.nomad'),
                    text(name: 'TAG_REPLACEMENTS', value: "registry.comp.ystv.co.uk/sports-scores/bundle:${env.BUILD_NUMBER}")
                ]
            }
        }
    }

    post { always { cleanWs() }}
}
