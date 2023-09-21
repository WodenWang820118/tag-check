# DatalayerChecker

# Backend alpha version usage

This version mimics users' behaviors to use the app.

1. `http://localhost:8080/waiter/setRootProjectFolder?rootProjectPath=<path>`: select the root project folder
2. `http://localhost:8080/waiter/setProjectName?projectName=<name>`: select a existed project based on the folder name, otherwise
3. `http://localhost:8080/waiter/initProject?projectName=<name>`: initialize the project if it's not existed
4. Other APIs for testing automation
