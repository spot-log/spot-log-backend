pipeline {
    agent any

    stages {
        stage('Git Checkout') {
            steps {
                checkout scm
                echo 'Git Checkout Success!'
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
