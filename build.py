import subprocess
import json

FILES = ["manifest.json", "LICENSE", "README.md",
         "stuff-your-opinion.js", "icons/*.png"]


def get_version():
    with open("manifest.json") as f:
        data = json.loads(f.read())
        return data["version"]


def get_output_name():
    return "stuff_your_opinion-v{}.zip".format(get_version())


def main():
    args = ["C:\\Program Files\\7-Zip\\7z.exe",
            "a", "-tzip", get_output_name()]
    args.extend(FILES)
    subprocess.run(args)


if __name__ == "__main__":
    main()
