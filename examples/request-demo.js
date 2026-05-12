const payload = {
  botId: "gsm-guide",
  channelId: "room-1",
  message: "Tell me some dorm life tips.",
  metadata: {
    locale: "ko-KR",
  },
};

const response = await fetch("http://localhost:3000/chat/respond", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log(result);

