import requests
import json

url = "http://127.0.0.1:7001/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer linuxdo",
}
payload = {
    "model": "gemini-2.0-flash",
    "messages": [{"role": "user", "content": "你好，请介绍一下你自己"}],
    "temperature": 0.7,
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())
