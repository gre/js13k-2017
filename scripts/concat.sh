
cat src/pre.js

if [ "$NODE_ENV" == "production" ]; then
  cat src/env_prod.js
else
  cat src/env_dev.js
fi;

# libs

cat src/lib/math.js
cat src/lib/path.js
cat src/lib/asteroids.font.js
cat src/lib/webgl.js
cat src/lib/jsfxr.js
cat src/lib/audio.js

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
cat src/logic.js
cat src/state.js
cat src/sounds.js
cat src/input.js
cat src/ui.js
cat src/game.js

cat src/post.js
