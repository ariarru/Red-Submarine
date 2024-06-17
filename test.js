<script id="vertex-shader" type="not-javascript">
            attribute vec4 a_position;
            attribute vec3 a_normal;
            attribute vec3 a_tangent;
            attribute vec2 a_texcoord;
            attribute vec4 a_color;

            uniform mat4 u_projection;
            uniform mat4 u_view;
            uniform mat4 u_world;
            uniform vec3 u_viewWorldPosition;

            //luce del mondo
            uniform vec3 u_lightWorldPosition;
            uniform float u_lightWorldIntensity;

            varying vec3 v_normal;
            varying vec3 v_tangent;
            varying vec3 v_surfaceToView;
            varying vec2 v_texcoord;
            varying vec4 v_color;
            varying vec3 v_worldPosition;   // posizione nel mondo
            varying vec3 v_worldNormal;      //normali orientate nel mondo
            varying vec3 v_surfaceToLightWorld;   //come risponde la superficie alla luce
            varying vec3 v_surfaceToLightSub;
            varying vec3 v_lightWorldPos;
            

            void main() {
                vec4 worldPosition = u_world * a_position;
                gl_Position = u_projection * u_view * worldPosition;
                v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
                mat3 normalMat = mat3(u_world);
                v_normal = normalize(normalMat * a_normal);
                v_tangent = normalize(normalMat * a_tangent);

                v_texcoord = a_texcoord;
                v_color = a_color;
                v_worldPosition = (u_world * a_position).xyz;
                v_worldNormal = mat3(u_worldInverseTraspose) * a_normal;
                 
                // calcolo le componenti della luce
                v_surfaceToLightWorld = u_lightWorldPosition - surfaceWorldPosition;
                v_lightWorldPos = u_lightWorldPosition;
            }
        </script>

        <script id="fragment-shader" type="not-javascript">
            precision highp float;

            varying vec3 v_normal;
            varying vec3 v_tangent;
            varying vec3 v_surfaceToView;
            varying vec2 v_texcoord;
            varying vec4 v_color;

            uniform vec3 diffuse;
            uniform sampler2D diffuseMap;
            uniform vec3 ambient;
            uniform vec3 emissive;
            uniform vec3 specular;
            uniform sampler2D specularMap;
            uniform float shininess;
            uniform sampler2D normalMap;
            uniform float opacity;
            uniform vec3 u_lightDirection;
            uniform vec3 u_ambientLight;

            void main () {
            vec3 normal = normalize(v_normal) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
            vec3 tangent = normalize(v_tangent) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
            vec3 bitangent = normalize(cross(normal, tangent));

            mat3 tbn = mat3(tangent, bitangent, normal);
            normal = texture2D(normalMap, v_texcoord).rgb * 2. - 1.;
            normal = normalize(tbn * normal);

            vec3 surfaceToViewDirection = normalize(v_surfaceToView);
            vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

            float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
            float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);
            vec4 specularMapColor = texture2D(specularMap, v_texcoord);
            vec3 effectiveSpecular = specular * specularMapColor.rgb;

            vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
            vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
            float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

            gl_FragColor = vec4(
                emissive +
                ambient * u_ambientLight +
                effectiveDiffuse * fakeLight +
                effectiveSpecular * pow(specularLight, shininess),
                effectiveOpacity);
            }
            


            --------------------------------


            <script id="vertex-shader" type="not-javascript">
            attribute vec4 a_position;
            attribute vec3 a_normal;
            attribute vec3 a_tangent;
            attribute vec2 a_texcoord;
            attribute vec4 a_color;

            uniform mat4 u_projection;
            uniform mat4 u_view;
            uniform mat4 u_world;
            uniform vec3 u_viewWorldPosition;
            uniform mat4 u_worldInverseTraspose;

            //luce del mondo
            uniform vec3 u_lightWorldPosition;
            uniform float u_lightWorldIntensity;

            varying vec3 v_normal;
            varying vec3 v_tangent;
            varying vec3 v_surfaceToView;
            varying vec2 v_texcoord;
            varying vec4 v_color;
            varying vec3 v_worldPosition;   // posizione nel mondo
            varying vec3 v_worldNormal;      //normali orientate nel mondo
            varying vec3 v_surfaceToLightWorld;   //come risponde la superficie alla luce
            varying vec3 v_surfaceToLightSub;
            varying vec3 v_lightWorldPos;
            

            void main() {
                vec4 worldPosition = u_world * a_position;
                gl_Position = u_projection * u_view * worldPosition;
                v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
                mat3 normalMat = mat3(u_world);
                v_normal = normalize(normalMat * a_normal);
                v_tangent = normalize(normalMat * a_tangent);

                v_texcoord = a_texcoord;
                v_color = a_color;
                v_worldPosition = (u_world * a_position).xyz;
                v_worldNormal = mat3(u_worldInverseTraspose) * a_normal;
                vec3 surfaceWorldPosition = (u_world * a_position).xyz;

                 
                // calcolo le componenti della luce
                v_surfaceToLightWorld = u_lightWorldPosition - surfaceWorldPosition;
                v_lightWorldPos = u_lightWorldPosition;
            }
        </script>

        <script id="fragment-shader" type="not-javascript">
            precision highp float;

            // Passato dal vertex shader.
            varying vec3 v_normal;
            varying vec3 v_tangent;
            varying vec3 v_surfaceToLightWorld;
            varying vec3 v_surfaceToView;
            varying vec2 v_texcoord;
            varying vec4 v_color;
            
            varying vec3 v_worldPosition;
            varying vec3 v_worldNormal;
            varying vec3 v_lightWorldPos;
            
            uniform sampler2D diffuseMap;    // Mappa diffuse
            uniform sampler2D specularMap;   // Mappa specular
            uniform sampler2D normalMap;     // Mappa normali
            
            uniform vec3 diffuse;            // Colore del materiale che non è colpito da luce
            uniform vec3 ambient;            // Colore dell'ambiente
            uniform vec3 emissive;           // Colore del materiale indipendentemente dalla luce, usato per le cose che brillano
            uniform vec3 specular;           // Colore della specularità
            uniform float shininess;         // Coefficiente di specularità
            uniform float opacity;           // Opacità del materiale
            
            uniform vec3 u_lightDirection;
            uniform vec3 u_ambientLight;
            uniform vec3 u_worldCameraPosition;     // Posizione della camera nel mondo
            
            void main () {
                vec3 normal = normalize(v_normal) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
                vec3 tangent = normalize(v_tangent) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
                vec3 bitangent = normalize(cross(normal, tangent));
            
                vec3 worldNormal = normalize(v_worldNormal);
                // Calcola la direzione dal punto di vista dell'occhio alla superficie
                vec3 eyeToSurfaceDir = normalize(v_worldPosition - u_worldCameraPosition);
            
                // Riflette la direzione dell'occhio-superficie rispetto alla normale del mondo
                vec3 direction = reflect(eyeToSurfaceDir, worldNormal);
            
                mat3 tbn = mat3(tangent, bitangent, normal);
                normal = texture2D(normalMap, v_texcoord).rgb * 2.0 - 1.0;
                normal = normalize(tbn * normal);
            
                // Luce riflessa
                vec3 surfaceToLightDirectionWolrd = normalize(v_surfaceToLightWorld);
                vec3 surfaceToViewDirection = normalize(v_surfaceToView);
                vec3 reflectedLightWorld = reflect(-v_surfaceToLightWorld, normal);
                vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);
            
                float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
                float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);
                vec4 specularMapColor = texture2D(specularMap, v_texcoord);
                vec3 effectiveSpecular = specular * specularMapColor.rgb;
            
                float distanceWorld = max(dot(normal, normalize(v_lightWorldPos - u_worldCameraPosition)), 0.0);
                float attenuationWorld = 1.0 / (distanceWorld * distanceWorld);
            
                vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
                vec3 effectiveDiffuse = diffuse * attenuationWorld * diffuseMapColor.rgb * v_color.rgb;
                float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;
            
                gl_FragColor = vec4(
                    emissive +
                    ambient * u_ambientLight +
                    attenuationWorld * effectiveDiffuse * fakeLight +
                    effectiveSpecular * pow(specularLight, shininess),
                    effectiveOpacity
                );
            
            }
            
            
        </script>

        <!-- vertex e fragment shader per la gestione della skybox-->
        <script id="skybox-vertex-shader" type="not-javascript">
            attribute vec4 a_position;
            varying vec4 v_position;
            void main(){
                v_position = a_position;
                gl_Position = a_position;
                gl_Position.z = 1.0;
            }
        </script>
        <script id="skybox-fragment-shader" type="not-javascript">
            precision mediump float;

            uniform samplerCube u_skybox;
            uniform mat4 u_viewDirectionProjectionInverse;

            varying vec4 v_position;
            void main() {
                vec4 t = u_viewDirectionProjectionInverse * v_position;
                gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
            }