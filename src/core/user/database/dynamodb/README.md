## Description

This folder contains common logic for the saving, querying, updating, etc. of Users to a database

## Database schema - NOSQL

Primary Key: UUID
Sort Key: User Object Identifier

GSI1 Primary Key: Email Address
GSI1 Sort Key: Sort Key: User Object Identifier

GSI2 Primary key: Username
GSI1 Sort Key: Sort Key: User Object Identifier
