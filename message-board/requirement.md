## Task

Your task is to design a simple async API where users can register to get a userId, then they  can request messages, create boards and post messages to a board. 
 
As a minimum, your API should allow a user to: 
-	Register for a userId by providing their name and email address: the userId will not returned immediately, instead, the lambda function will broadcast an event using SNS, a downstream lambda function will be triggered and generate a new user with Id.
-	Get user by email: will return userId, user’s name and email immediately. 
-	List message boards: will return all message boards immediately.
-	Create a new message board: this time, instead of using SNS, will use SQS queue to trigger down-stream lambda function.
-	Post a message to a board: again, using SNS event broadcasting like creating a user.
-	Additionally, it would be great to allow users to: 
-	Subscribe to new messages topic to receive messages in real-time (Using Appsync or Websocket)
-	Get anything else you might think is useful 
 
## Technical requirements: 

-	Please use AWS API Gateway
-	Store data (user details, messages etc) in Dynamodb 
-	Event message system use SNS and SQS
-	Please use the serverless framework (see serverless.com) to deploy all your infrastructure (API, lambdas, dynamo etc) to AWS cloud environment (not local stack)
-	Use serverless.yml to create the serverless application
-	Use Typescript in your lambda(s) 
-	Implement types in your scripts
-	Assume that the API you design will need to be extended in the future 
-	Provide a way to test your API
-	Fully AI generated code will not be accepted
