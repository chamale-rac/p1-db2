import json
from faker import Faker
from random import randint
from bson import json_util

import time
from datetime import datetime

start_time = time.time()

EVENTS = 10

fake = Faker()

events = []


def generate_events():
    for _ in range(EVENTS):
        event = {
            "title": fake.sentence(),
            "description": fake.text(),
            "date": datetime.combine(fake.future_date(), datetime.min.time()),
            "duration": randint(0, 720),
            # missing chat
            "hour": f"{randint(0, 23)}:{randint(0, 59)}",
            "link": fake.url(),
            # missing creator
            "limit": randint(5, 25),
            "tags": fake.words(nb=3),
        }
        events.append(event)


generate_events()
with open("./data/bulkEvents.json", "w") as f:
    json.dump(events, f, default=json_util.default, indent=4)
print("Events saved")
print("--- %s seconds ---" % (time.time() - start_time))
