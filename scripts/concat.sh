
echo "(function(){"

if [ "$NODE_ENV" == "production" ]; then
  cat src/env_prod.js
else
  cat src/env_dev.js
fi;

# libs

cat src/lib/math.js
cat src/lib/webgl.js

# shaders

cd build;
for glsl in *.frag *.vert; do
  name=`echo $glsl | tr '.' '_' | tr '[:lower:]' '[:upper:]'`
  cat $glsl | ../scripts/wrapjs.sh $name
  echo
done
cd ..;

# game
#
cat src/setup.js
cat src/input.js
cat src/logic.js
cat src/main.js

echo "}())"
