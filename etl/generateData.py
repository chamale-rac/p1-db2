import json
from faker import Faker
from random import randint, choice
from bson import ObjectId
# Take the time of generation
import time

start_time = time.time()

# AKA Temporal2023!
PASSWORD = "$2b$10$giSkSavq9kT1h3TxE/NryetqRpXhCL7qj1z9nlIPMvx.Zs5nM4Pmy"

USERS = 10000
EVENTS = 55000
RELATIONSHIPS = 40000

fake = Faker()

chats = []


def generate_users():
    users = []
    for _ in range(USERS):
        user = {
            "_id": str(ObjectId()),
            "username": fake.user_name(),
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

        chatId = str(ObjectId())

        messages = []
        if status1 == "accepted":
            for _ in range(randint(1, 5)):
                message = {
                    "message": fake.text(),
                    "user": choice([user1, user2]),
                    "sent_at": fake.past_date().isoformat()
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
            "status": status1,
            "chatId": chatId,
        }

        relation2 = {
            "user": user2,
            "status": status2,
            "chatId": chatId,
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
        participants.extend([choice(user_ids) for _ in range(randint(1, 10))])
        savers = [choice(user_ids) for _ in range(randint(1, 4))]
        chatId = str(ObjectId())
        eventId = str(ObjectId())

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
        for _ in range(randint(1, 10)):
            message = {
                "message": fake.text(),
                "user": choice(participants),
                "sent_at": fake.future_date().isoformat()
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
            "_id": str(ObjectId()),
            "title": fake.sentence(),
            "creator": creator,
            "description": fake.text(),
            "participants": participants,
            "date": fake.future_date().isoformat(),
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

with open('users.json', 'w') as f:
    json.dump(users, f, indent=4)
print("Users saved")
print("--- %s seconds ---" % (time.time() - start_time))
with open('events.json', 'w') as f:
    json.dump(events, f, indent=4)
print("Events saved")
print("--- %s seconds ---" % (time.time() - start_time))
with open('chats.json', 'w') as f:
    json.dump(chats, f, indent=4)
print("Chats saved")
print("--- %s seconds ---" % (time.time() - start_time))
print("Done")
print("--- %s seconds ---" % (time.time() - start_time))
