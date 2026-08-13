"""Web stack layers PoC -- a request flowing through a chain of middleware layers.
Illustrates the core mechanism: each layer wraps the next, adding something on the way
in and/or the way out, and the order in which layers run is visible in the output.
"""

from typing import Callable

Handler = Callable[[dict], dict]


def logging_layer(next_layer: Handler) -> Handler:
    def handle(request: dict) -> dict:
        print(f"  [logging]  in:  {request['path']}")
        response = next_layer(request)
        print(f"  [logging]  out: status={response['status']}")
        return response
    return handle


def auth_layer(next_layer: Handler) -> Handler:
    def handle(request: dict) -> dict:
        print(f"  [auth]     checking token for {request['path']}")
        request["user"] = "jay"
        return next_layer(request)
    return handle


def cache_layer(cache: dict) -> Callable[[Handler], Handler]:
    def wrap(next_layer: Handler) -> Handler:
        def handle(request: dict) -> dict:
            if request["path"] in cache:
                print(f"  [cache]    hit for {request['path']}")
                return cache[request["path"]]
            print(f"  [cache]    miss for {request['path']}")
            response = next_layer(request)
            cache[request["path"]] = response
            return response
        return handle
    return wrap


def app_layer(request: dict) -> dict:
    print(f"  [app]      handling {request['path']} for user={request.get('user')}")
    return {"status": 200, "body": f"hello, {request.get('user')}"}


if __name__ == "__main__":
    cache: dict = {}
    # Layers compose from the outside in: logging -> auth -> cache -> app.
    stack = logging_layer(auth_layer(cache_layer(cache)(app_layer)))

    print("request 1 (/profile):")
    stack({"path": "/profile"})

    print("\nrequest 2 (/profile again -- cache should hit):")
    stack({"path": "/profile"})
