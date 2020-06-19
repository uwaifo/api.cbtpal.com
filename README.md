# Backend for CBTPAL

This is an assessment management web app. This is the repository for the server side code.

## Setup

Clone the repository, then in the root project directory run **npm install** to install all dependencies

#### Start server

Run **npm start** in the root project directory to start the server

## Environment Variables

In the root directory create a **.env** File

### Add the following environment variable in your .env file

**PORT = 8080**

**DB_URL = mongodb://localhost:27017/motion-hire**

**JWT_SECRET = ASK YOUR TEAM LEAD FOR THIS KEY**

**EMAIL_SECRET = ASK YOUR TEAM LEAD FOR THIS KEY**

**SENDGRID_API_KEY = ASK YOUR TEAM LEAD FOR THIS KEY**

**CALENDLY_KEY = ASK YOUR TEAM LEAD FOR THIS KEY**

# Git Branching System

Master Branch - Production

Development Branch - Staging/Testing

Other Feature Branches: Naming Format - feature/"appropriate name for what you are working on"

## Note:

**ON NO ACCOUNT SHOULD YOU WRITE CODE DIRECTLY IN THE MASTER BRANCH OR DEVELOPMENT BRANCH**.
After cloning the repo and running npm install checkout to the development branch, then create sub branches from the development branch.
