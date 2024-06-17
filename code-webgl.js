"use strict";


async function main() {
  // Get A WebGL context
  const canvas = document.getElementById("mainCanva");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }
  //setup program
  const programInfo = webglUtils.createProgramInfo(gl, ["vertex-shader", "fragment-shader"]);
  const skyboxProgramInfo = webglUtils.createProgramInfo(gl, ["skybox-vertex-shader", "skybox-fragment-shader"]);


  // Create a buffer for positions
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put the positions in the buffer
 

  // Create a buffer to put normals in
  var normalBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = normalBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  

  /* -- Definisco la sky box -- */
  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: './res/skybox/px.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: './res/skybox/nx.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: './res/skybox/py.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: './res/skybox/ny.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: './res/skybox/pz.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: './res/skybox/nz.png',
    },
  ];
  
  faceInfos.forEach((faceInfo) => {
    const {target, url} = faceInfo;

    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      
      // Check if the image is a power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      } else {
          // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
          gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);



  /*--- Definisco le variabili dei tasti per muoversi---*/

  var keyFoward = false;    //tasto per muoversi avanti W
  var keyUp = false;        //tasto per muoversi in su E
  var keyDown = false;      //tasto per muoversi in giù S
  var keyRight = false;     //tasto per virare a destra D
  var keyLeft = false;      //tasto per virare a sinistra A

  // definisco eventi
  //window.addEventListener();


  
  /* - array di tutti gli elementi da disegnare - */
  var elementsToDraw =[];

  /* -- Dichiaro il sottomarino -- */
  const subBody = await generateBuffer('./res/sub-body.obj');
  var subTransl = [0, -3, -1.7];
  var submarineUniforms = {
    u_matrix: m4.identity(),
  };
  /* aggiungo all'array il sottomarino*/
  elementsToDraw.push({
    programInfo: programInfo,
    parts: subBody.parts,
    obj: subBody.obj,
    uniforms: submarineUniforms,
    translation: subTransl,
    xRotation: degToRad(0),
    yRotation: degToRad(-90.0),
    zRotation: 0,
  });  
  /* -- Dichiaro le eliche -- */
  const subPropellers = await generateBuffer('./res/sub-eliche.obj');
  /* aggiungo all'array le eliche*/
  elementsToDraw.push({
    programInfo: programInfo,
    parts: subPropellers.parts,
    obj: subPropellers.obj,
    uniforms: submarineUniforms,
    translation: subTransl,
    xRotation: 4,
    yRotation: degToRad(-90.0),
    zRotation: 0,
    animate: true,
  });  

  /* -- Dichiaro gli scogli-- */
  const  indexes = [1, 2, 3, 4 , 5, 6, 13, 16];
  var rocksUniform = {
    u_matrix: m4.identity(),
  };
  for(const i of indexes){
    var href ='./res/rocks/scoglio-'+i.toString()+'.obj';
    const rock = await generateBuffer(href.toString());
    var rockTrasl = [getRandomInt(-20, 20), getRandomInt(-20, 20), getRandomInt(-40, -5)];
    elementsToDraw.push({
      programInfo: programInfo,
      parts: rock.parts,
      obj: rock.obj,
      uniforms: rocksUniform,
      translation: rockTrasl,
      xRotation: 0,//degToRad(getRandomInt(-20, 20)),
      yRotation: 0,//degToRad(getRandomInt(-20, 20)),
      zRotation: 0,
    }); 
  }






  function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation, zRotation) {
    var matrix = m4.translate(viewProjectionMatrix,
        translation[0],
        translation[1],
        translation[2]);
    matrix =m4.yRotate(matrix, yRotation);
    matrix = m4.xRotate(matrix, xRotation);
    matrix = m4.zRotate(matrix, zRotation);
    return matrix;
  }



  /* Gestione della camera */
  const cameraTarget = [0, 0, 0];
  const cameraPosition= [0, 0, 8 ];

  /* bottoni per movimento camera */
  const btnRight = document.getElementById("right");
  const btnLeft = document.getElementById("left");
  const btnUp = document.getElementById("up");
  const btnDown = document.getElementById("down");

  btnRight.addEventListener("click", function() { 
    moveCamera(0, true); 
    keyRight = true;});

  btnLeft.addEventListener("click", function() { moveCamera(0, false); keyLeft=true;});
  btnUp.addEventListener("click",  function() {moveCamera(1, true); keyUp = true;});
  btnDown.addEventListener("click",  function() {moveCamera(1, false); keyDown=true;});

  
  /* funzioni per movimento camera */
  function moveCamera(index, fw){
    cameraTarget[index] = cameraTarget[index] + (fw ? 1.5 : -1.5);
    cameraPosition[index] = cameraPosition[index] + (fw ? 1 : -1);
    //qui in realtà la camera deve essere moltiplicata rispetto alla matrice del sottomarino a rendere time
  }


  

  function render(time) {
    time *= 0.001;  // convert to seconds

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_TEST);


    /* Gestione camera */
    const cameraPositionVector = m4.addVectors(cameraTarget, cameraPosition);
    const view_up = [0, 1, 0];
    const camera = m4.lookAt(cameraPositionVector, cameraTarget, view_up);

    //if key pressed moltiplica matrice camera per posizione sottomarino tipo

    
    //campo della vista nell'asse y in radianti
    const fovy = degToRad(60);
    //aspect ratio 
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fovy, aspect, 1, 2000);
    // Make a view matrix from the camera matrix.
    const view = m4.inverse(camera);
    // We only care about direction so remove the translation
    var viewDirectionMatrix = m4.copy(view);
    viewDirectionMatrix[12] = 0;
    viewDirectionMatrix[13] = 0;
    viewDirectionMatrix[14] = 0;

    var viewDirectionProjectionMatrix = m4.multiply(
      projection, viewDirectionMatrix);
    var viewDirectionProjectionInverseMatrix =
      m4.inverse(viewDirectionProjectionMatrix);

    /*-- Gestione luci-- */
    //luce sottomarino


    
    // ---- coordinate luce e camera ------
    let u_world= m4.identity();
    const u_worldInverseTraspose = m4.transpose(m4.inverse(u_world));
    const sharedUniforms = {
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPositionVector,
      opacity:0.5,
     // ambient: [0,0,255],
      u_lightWorldPosition: [0, 20, -3],
      u_lightWorldIntensity: 0.2,
      u_worldInverseTraspose: u_worldInverseTraspose,
    };
    gl.useProgram(programInfo.program);
    // calls gl.uniform
    webglUtils.setUniforms(programInfo, sharedUniforms);

  

    // ------ Draw the objects --------
    //u_world sono le coordinate dell'oggetto nel mondo

    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;
 
    elementsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var objBufferInfo = object.bufferInfo;
      var bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);
        bindBuffers = true;
      }
      // Setup all the needed attributes.
      if (bindBuffers || objBufferInfo !== lastUsedBufferInfo) {
        lastUsedBufferInfo = objBufferInfo;  
      }

      // definisco la matrice
      // gestisco animazioni
      object.uniforms.u_matrix = computeMatrix(
        u_world,
        object.translation,
        object.animate ? object.xRotation * time : object.xRotation,
        object.yRotation,
        object.zRotation);
      
      let u_world_local = object.uniforms.u_matrix;

      // renderizzo passando più array //
      for (const {bufferInfo, material} of object.parts) {
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        
        // calls gl.uniform
        webglUtils.setUniforms(programInfo, { u_world: u_world_local,  }, material); // come parametro solo cose scritte nel vertex shader

        /* -- Qui avviene l'effettiva renderizzazione -- */
        // calls gl.drawArrays or gl.drawElements
        webglUtils.drawBufferInfo(gl, bufferInfo);
      }

    });


    // ----- Skybox ----------
    // Turn on the position attribute
    //gl.enableVertexAttribArray(positionLocation);

    //quadBufferInfo contiene le informazioni del cubo che contiene la skybox
    const quadBufferInfo =  {
      position: { numComponents: 2, data: null, },
    };
    quadBufferInfo.position.data = [
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
  ];

  
    gl.depthFunc(gl.LEQUAL);


    //cambio il program per lavorare sulla skybox
    gl.useProgram(skyboxProgramInfo.program);
    //assegno il buffer
    var bufferSkybox = webglUtils.createBufferInfoFromArrays(gl, quadBufferInfo);
    webglUtils.setBuffersAndAttributes(gl, skyboxProgramInfo, bufferSkybox);
    //definisco uniform
    webglUtils.setUniforms(skyboxProgramInfo, {
      u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
      u_skybox: texture, //assegno l'immagine
    });

    webglUtils.drawBufferInfo(gl, bufferSkybox);
    

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
