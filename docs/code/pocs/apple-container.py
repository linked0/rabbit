"""Apple `container`: parse an OCI image reference and mock a pull + run,
illustrating the "container run <image>" mental model (no real container ops).
"""
from dataclasses import dataclass


@dataclass
class ImageRef:
    name: str
    tag: str

    @classmethod
    def parse(cls, ref):
        if ":" in ref:
            name, tag = ref.rsplit(":", 1)
        else:
            name, tag = ref, "latest"
        return cls(name=name, tag=tag)

    def __str__(self):
        return f"{self.name}:{self.tag}"


def pull(image: ImageRef):
    print(f"$ container pull {image}")
    print(f"  -> resolving OCI manifest for {image.name}, tag={image.tag}")
    print(f"  -> layers fetched (mocked), image ready as lightweight VM image")


def run(image: ImageRef, command):
    print(f"$ container run {image} {' '.join(command)}")
    print(f"  -> booting lightweight Linux VM on Apple Silicon (mocked)")
    print(f"  -> exec: {' '.join(command)}")
    return {"exit_code": 0, "stdout": "hello from inside the container (mocked)"}


for ref in ["nginx:1.27", "alpine"]:
    image = ImageRef.parse(ref)
    pull(image)
    result = run(image, ["echo", "hello"])
    print(f"  exit_code={result['exit_code']} stdout={result['stdout']!r}\n")
