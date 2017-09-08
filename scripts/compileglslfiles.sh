
if [ "$#" -ne 2 ] && [ "$#" -ne 3 ]; then
  echo "Invalid arguments. Usage: $0 fromDir toDir [--copy]" >&2;
  exit 1;
fi;
if [ "$1" == "$2" ]; then
  echo "fromDir and toDir must be different" >&2;
  exit 2;
fi;
if [ ! -d "$1" ]; then
  echo "fromDir must be a directory" >&2;
  exit 3;
fi;
if [ ! -d "$2" ]; then
  echo "toDir must be a directory" >&2;
  exit 4;
fi;

for glsl in $1/*.frag $1/*.vert; do
  name=`basename $glsl`;
  if [[ "$3" == "--copy" ]]; then
    cat $glsl > $2/$name;
  else
    cat $glsl | glslmin > $2/$name;
  fi
done;
