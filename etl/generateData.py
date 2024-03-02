import json
from faker import Faker
from random import randint, choice
from bson import ObjectId, json_util
# Take the time of generation
import time
from datetime import datetime

start_time = time.time()

# AKA Temporal2023!
PASSWORD = "$2b$10$giSkSavq9kT1h3TxE/NryetqRpXhCL7qj1z9nlIPMvx.Zs5nM4Pmy"

USERS = 15000
EVENTS = 50000
RELATIONSHIPS = 40000

fake = Faker()

chats = []


def generate_users():
    users = []
    for _ in range(USERS):
        user = {
            "_id": ObjectId(),
            "username": fake.user_name() + str(randint(100, 999)) + str(randint(100, 999)),
            "name": fake.first_name(),
            "lastname": fake.last_name(),
            "email": fake.email(),
            "password": PASSWORD,
            "profilePicture": fake.image_url(),
            "gender": choice(["male", "female"]),
            "age": randint(15, 70),
            "interests": fake.words(nb=3),
            "favorites": fake.words(nb=3),
            "joinedEvents": [],
            "savedEvents": [],
            "relations": []
        }
        users.append(user)
    return users


def generateRelationships(user_ids):
    for _ in range(RELATIONSHIPS):
        # Two distinct users
        user1, user2 = choice(user_ids), choice(user_ids)
        # Check are not the same
        while user1 == user2:
            user2 = choice(user_ids)
        status_options = ["pending", "accepted"]
        status1 = choice(status_options)
        if status1 == "accepted":
            status2 = "accepted"
        else:
            status2 = "requested"

        chatId = ObjectId()

        messages = []
        if status1 == "accepted":
            for _ in range(randint(1, 3)):
                message = {
                    "message": fake.text(),
                    "user": choice([user1, user2]),
                    "sent_at": datetime.combine(fake.past_date(), datetime.min.time())
                }
                messages.append(message)

        chat = {
            "_id": chatId,
            "participants": [user1, user2],
            "type": "private",
            "messages": messages
        }

        relation1 = {
            "user": user1,
            "state": status1,
            "chat_id": chatId,
        }

        relation2 = {
            "user": user2,
            "state": status2,
            "chat_id": chatId,
        }

        chats.append(chat)
        # Append to the relations of each user
        user = next(user for user in users if user["_id"] == user1)
        user["relations"].append(relation2)
        user = next(user for user in users if user["_id"] == user2)
        user["relations"].append(relation1)


def generate_events(user_ids):
    events = []
    for _ in range(EVENTS):
        creator = choice(user_ids)
        participants = [creator]
        participants.extend([choice(user_ids) for _ in range(randint(1, 7))])
        savers = [choice(user_ids) for _ in range(randint(1, 3))]
        chatId = ObjectId()
        eventId = ObjectId()

        # Add to the user createdEvents
        user = next(user for user in users if user["_id"] == creator)
        # Add to the participants to joinedEvents
        for participant in participants:
            user = next(user for user in users if user["_id"] == participant)
            user["joinedEvents"].append(eventId)
        # for some random participants add to savedEvents
        for participant in participants[:randint(0, len(participants))]:
            user = next(user for user in users if user["_id"] == participant)
            user["savedEvents"].append(eventId)
        for saver in savers:
            user = next(user for user in users if user["_id"] == saver)
            user["savedEvents"].append(eventId)

        # Generate messages: [{message, user, sent_at}] using the participants
        messages = []
        for _ in range(randint(1, 5)):
            message = {
                "message": fake.text(),
                "user": choice(participants),
                "sent_at": datetime.combine(fake.past_date(), datetime.min.time())
            }
            messages.append(message)

        chat = {
            "_id": chatId,
            "participants": participants,
            "type": "event",
            "event_id": eventId,
            "messages": messages
        }
        chats.append(chat)

        event = {
            "_id": eventId,
            "title": fake.sentence(),
            "creator": creator,
            "description": fake.text(),
            "participants": participants,
            "date": datetime.combine(fake.future_date(), datetime.min.time()),
            "duration": randint(0, 720),
            "hour": f"{randint(0, 23)}:{randint(0, 59)}",
            "link": fake.url(),
            "chat": chatId,
            "tags": fake.words(nb=3),
            "limit": randint(len(participants)+2, 50),
        }
        events.append(event)
    return events


users = generate_users()
user_ids = [user["_id"] for user in users]
print("Users generated")
print("--- %s seconds ---" % (time.time() - start_time))
events = generate_events(user_ids)
print("Events generated")
print("--- %s seconds ---" % (time.time() - start_time))
generateRelationships(user_ids)
print("Relationships generated")
print("--- %s seconds ---" % (time.time() - start_time))

with open('./data/users.json', 'w') as f:
    json.dump(users, f, default=json_util.default, indent=4)
print("Users saved")
print("--- %s seconds ---" % (time.time() - start_time))
with open('./data/events.json', 'w') as f:
    json.dump(events, f, default=json_util.default, indent=4)
print("Events saved")
print("--- %s seconds ---" % (time.time() - start_time))
with open('./data/chats.json', 'w') as f:
    json.dump(chats, f, default=json_util.default, indent=4)
print("Chats saved")
print("--- %s seconds ---" % (time.time() - start_time))
print("Done")
print("--- %s seconds ---" % (time.time() - start_time))
