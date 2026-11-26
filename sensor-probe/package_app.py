import io,json,zipfile,pathlib
root=pathlib.Path("sensor-probe")
build=root/"build"
manifest=json.loads((build/"app.json").read_text())
assert manifest["app"]["appType"]=="app"
assert {p["deviceSource"] for p in manifest["platforms"]}==set(range(260,267))
assert (build/"page/index.js").is_file()
assert (build/"app.js").is_file()
device=io.BytesIO()
with zipfile.ZipFile(device,"w",zipfile.ZIP_DEFLATED) as z:
    for p in build.rglob("*"):
        if p.is_file() and p.name!=".gitignore": z.write(p,p.relative_to(build).as_posix())
side=io.BytesIO()
with zipfile.ZipFile(side,"w",zipfile.ZIP_DEFLATED) as z:
    z.writestr("app.json",json.dumps(manifest))
with zipfile.ZipFile(root/"dist/sensor-probe-app.zip","w",zipfile.ZIP_DEFLATED) as z:
    z.writestr("device.zip",device.getvalue())
    z.writestr("app-side.zip",side.getvalue())
