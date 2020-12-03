const aws = require('aws-sdk')
const jp = require('jsonpath')

aws.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: "ap-southeast-1"
})

const tableName = "ConversationName"
const docClient = new aws.DynamoDB.DocumentClient();
const dynamodb = new aws.DynamoDB();

function checkTableExists(tableName, callback) {
    dynamodb.listTables().promise().then(data => {
        const exists = data.TableNames.filter(name => {
            return name === tableName;
        }).length > 0

        callback(exists)
    })
}

function findIDRoomByIdUser12(id_user_1, id_user_2) {
    return new Promise((resolve, reject) => {
        docClient.scan({
            TableName: tableName,
            FilterExpression: "#id_user_1=:id_user_1 and #id_user_2=:id_user_2",
            ExpressionAttributeNames: {
                "#id_user_1": "id_user_1",
                "#id_user_2": "id_user_2"
            },
            ExpressionAttributeValues: {
                ":id_user_1": id_user_1,
                ":id_user_2": id_user_2,
            }
        }, (err, data) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(data.Items[0])
            }
        });
    });
}

function findIDRoomByIdUser21(id_user_2, id_user_1) {
    return new Promise((resolve, reject) => {
        docClient.scan({
            TableName: tableName,
            FilterExpression: "#id_user_1=:id_user_1 and #id_user_2=:id_user_2",
            ExpressionAttributeNames: {
                "#id_user_1": "id_user_1",
                "#id_user_2": "id_user_2"
            },
            ExpressionAttributeValues: {
                ":id_user_1": id_user_2,
                ":id_user_2": id_user_1,
            }
        }, (err, data) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(data.Items[0])
            }
        });
    });
}

function putNameRoom(Item) {
    return new Promise((resolve, reject) => {
        docClient.put({
            TableName: tableName,
            Item: Item
        }, (err, data) => {
            if (err)
                reject(err);
            else {
                resolve(true)
            }
        });
    });
}

function deleteRoomByID(id) {
    return new Promise((resolve, reject) => {
        docClient.delete({
            TableName: tableName,
            Key: {
                "id_room": id
            },
            ReturnValues: "ALL_OLD",
        }, (err, data) => {
            if (err)
                reject(err);
            else {
                const { Attributes } = data;
                resolve(Attributes);
            }
        });
    });
}

function createTable(tableName) {
    const params = {
        TableName: tableName,
        AttributeDefinitions: [
            {
                AttributeName: "id",
                AttributeType: "S"
            },
            {
                AttributeName: "time",
                AttributeType: "S"
            }
        ],
        KeySchema: [
            {
                AttributeName: "id",
                KeyType: "HASH"
            },
            {
                AttributeName: "time",
                KeyType: "RANGE"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    }

    return new Promise((resolve, reject) => {
        dynamodb.createTable(params, (err, data) => {
            if (err)
                reject(err)
            else
                resolve(data)
        })
    })
}

function putItemMessage(Item, tableName, callback) {
    checkTableExists(tableName, (result) => {
        if (result) {
            docClient.put({
                TableName: tableName,
                Item: Item
            }, (err, data) => {
                if (err)
                    callback(err)
                else {
                    callback(true)
                }
            });
        } else {
            createTable(tableName).then(data => {
                docClient.put({
                    TableName: tableName,
                    Item: Item
                }, (err, data) => {
                    if (err)
                        callback(err)
                    else {
                        callback(true)
                    }
                });
            })
        }
    })
}

function scanItemMessage(tableName, itemLast) {
    const params = {
        TableName: tableName,
        Limit: 4,
        ExclusiveStartKey: {
            time: itemLast
        }
    }

    return new Promise((resolve, reject) => {
        docClient.scan(params, (err, data) => {
            if (err) {
                reject(err)
            }
            else {
                console.log(data)
                resolve(data)
            }
        })
    })
}

function scanFirstItemMessage(id_room) {
    return new Promise((resolve, reject) => {
        var params = {
            TableName: id_room
            // Limit: 11,
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(data)
            }
        })
    })
}

function getAllRoomFor_A_User(id_user_1) {
    return new Promise((resolve, reject) => {
        var params = {
            TableName: tableName,
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(jp.query(data, '$.Items[?(@.id_user_1 ==' + id_user_1 + '|| @.id_user_2 ==' + id_user_1 + ')]'))
            }
        })
    })
}

module.exports = {
    findIDRoomByIdUser12, findIDRoomByIdUser21, putNameRoom, deleteRoomByID, createTable,
    putItemMessage, scanItemMessage, scanFirstItemMessage, getAllRoomFor_A_User
}