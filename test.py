import hmac
import hashlib
import base64


def calculate_secret_hash(username, client_id, client_secret):
    message = username + client_id
    digest = hmac.new(
        client_secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).digest()
    return base64.b64encode(digest).decode()


print(calculate_secret_hash("tao.dama.art@gmail.com", "2vq5u4asn3vmfmlh47iut3rd13",
      "1n8ad8g49g6ca7d5pm6pjqb8hu4k355gi9k6vlsm4bcuku98d01j"))
