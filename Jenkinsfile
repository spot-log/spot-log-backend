pipeline {
    agent any

    stages {
        stage('Git Checkout') {
            steps {
                checkout scm
                echo 'Git Checkout Success!'
            }
        }

        stage('Copy .env to Server') {
            steps {
                withCredentials([file(credentialsId: 'env_secretfile', variable: 'ENV_FILE')]) {
                    sh '''
                        scp -o StrictHostKeyChecking=no $ENV_FILE ubuntu@${SERVER_IP}:/home/ubuntu/deploy/.env
                    '''
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t spot-log-backend:latest .'
                echo 'Docker Build Success!'
            }
        }

        stage('Docker Compose Up') {
            steps {
                sh 'docker compose down || true'
                sh 'docker compose up -d'
                echo 'Docker Compose Up Success!'
            }
        }
    }
}
