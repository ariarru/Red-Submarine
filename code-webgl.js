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


  
  /* - array di tutti gli elementi da disegnare - */
  var elementsToDraw =[];

  /* -- Dichiaro il sottomarino -- */
  const subBody = await generateBuffer('./res/sub-body.obj');
  //const submarine = new Object(subBody);
  var submarineUniforms = {
    u_matrix: m4.identity(),
  };
  /* aggiungo all'array il sottomarino*/
  elementsToDraw.push({
    parts: subBody.parts,
    obj: subBody.obj,
    uniforms: submarineUniforms,
  });  

  /* -- Dichiaro le eliche -- */
  const subPropellers = await generateBuffer('./res/sub-eliche.obj');
  var propUniform ={
    u_matrix: m4.copy(submarineUniforms.u_matrix),
  }
  /* aggiungo all'array le eliche*/
  elementsToDraw.push({
    parts: subPropellers.parts,
    obj: subPropellers.obj,
    uniforms: propUniform,
    animate: true,
  });  

  /*-- Dichiaro il vettore luce del sottomarino -- */


  /* -- Dichiaro gli scogli-- */
/*  const  indexes = [1, 2, 3, 4 , 5, 6, 7, 8, 9, 10, 13, 16];


  // prendo tutti gli obj degli scogli con i rispettivi materiali
  const rocksObjs = [];
  for(let i=1; i<(indexes.length-1); i++){
    var href ='./res/rocks/scoglio-'+i.toString()+'.obj';
    const rock = await generateBuffer(href.toString());
    rocksObjs.push(rock);
  }

  async function addRock(y, rockNumber){
    var rockObject=rocksObjs[rockNumber]; 
    let rockMatrix= m4.translation(getXRock(), y, getRandomNumber(-80, 40));
    m4.xRotate(rockMatrix, degToRad(getRandomNumber(-20, 20)), rockMatrix);
    m4.yRotate(rockMatrix, degToRad(getRandomNumber(-20, 20)), rockMatrix);
    let uniform = {
      u_matrix : rockMatrix,
    }
    elementsToDraw.push({
      parts: rockObject.parts,
      obj: rockObject.obj,
      uniforms: uniform,
    }); 
  }

  //definisco in base alla la densità in base a y e poi genero randomicamente uno scoglio
  for(let y=0; y>-120; y-=3){
    let density = Math.abs( 0.5 * y- 2.5 ); 
    for(let n=0; n<density; n++){
      let randomRockNumber = Math.floor(Math.random()*rocksObjs.length);
      addRock(y, randomRockNumber);
    }
    
  }
*/

  /*--Dichiaro la parete di partenza-- */
  const backWall = await generateBuffer('./res/wall.obj');
  var wallUniform={
    u_matrix: m4.translation(9,0,0, m4.identity()),
  }
  elementsToDraw.push({
    parts: backWall.parts,
    obj: backWall.obj,
    uniforms: wallUniform,
  });
  let wallPos ={
    x: wallUniform.u_matrix[12],
    y: wallUniform.u_matrix[13],
    z: wallUniform.u_matrix[14],
  }


  /*--bubble-- */
  const bubble = await generateBuffer('./res/bubble.obj');
  var bubbleUniforms={
    u_matrix: m4.translation(-9,2,0, m4.identity()),
  }
  elementsToDraw.push({
    parts: bubble.parts,
    obj: bubble.obj,
    uniforms: bubbleUniforms,
  });

/*-- Definisco il tesoro --*/
  const treasure = await generateBuffer('./res/treasure/treasure-closed.obj');
  var treasureUniforms ={
    u_matrix: m4.translation(-9,3,0, m4.identity()),
  };
  elementsToDraw.push({
    parts: treasure.parts,
    obj: treasure.obj,
    uniforms: treasureUniforms,
  });


  /* -- Gestione della navigazione -- */
  const moves = new Move();
  //test con tasti
  window.addEventListener("keydown", (event)=>{
   moves.pressKey(event.keyCode);
  });
  
  window.addEventListener("keyup", (event)=>{
    moves.releaseKey(event.keyCode);
  });



  /* -- Gestione della camera -- */
  const cameraTarget = [0, 0, 0];
  const cameraPosition= [0, 2, 8];
  const cameraPositionVector = m4.addVectors(cameraTarget, cameraPosition);

  
  var degree=0;     //variabile cumulativa di gradi di rotazione delle eliche
  let then = 0;     //variabile per il calcolo del deltaTime

  let accelleration = 1.25; //accellerazione movimento
  let velocity=0;   //velocità del movimento del sottomairno
  let maxVelocity = 25; //massima velocità del sottomarino

  function render(time) {
    time *= 0.001;  // convert to seconds
    const deltaTime = time-then;
    then = time;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_TEST);


    /* Gestione camera */
    const camera = m4.yRotate(submarineUniforms.u_matrix, degToRad(90));
    m4.translate(camera, cameraPosition[0], cameraPosition[1], cameraPosition[2], camera);
    

    /*-- Gestione dei movimenti --*/
    moves.stopTarget();
    //if key pressed moltiplica matrice camera per posizione sottomarino tipo
    if(moves.foward){
      moves.setTarget(-1);
    }
    if(moves.rotateLeft){
      m4.yRotate(elementsToDraw[0].uniforms.u_matrix, degToRad(2), elementsToDraw[0].uniforms.u_matrix);
      elementsToDraw[1].uniforms.u_matrix = adaptPropellersRotateY(elementsToDraw[0].uniforms.u_matrix, elementsToDraw[1].uniforms.u_matrix);
     } 
    if(moves.rotateRight){
      m4.yRotate(elementsToDraw[0].uniforms.u_matrix, degToRad(-2), elementsToDraw[0].uniforms.u_matrix);
      elementsToDraw[1].uniforms.u_matrix = adaptPropellersRotateY(elementsToDraw[0].uniforms.u_matrix, elementsToDraw[1].uniforms.u_matrix);
    }
    if(moves.back){
      moves.setTarget(1);
    }
    if(moves.dive){
      m4.zRotate(elementsToDraw[0].uniforms.u_matrix, degToRad(2), elementsToDraw[0].uniforms.u_matrix);
      m4.zRotate(elementsToDraw[1].uniforms.u_matrix, degToRad(2), elementsToDraw[1].uniforms.u_matrix);
    }
    if(moves.emerge){
      m4.zRotate(elementsToDraw[0].uniforms.u_matrix, degToRad(-2), elementsToDraw[0].uniforms.u_matrix);
      m4.zRotate(elementsToDraw[1].uniforms.u_matrix, degToRad(-2), elementsToDraw[1].uniforms.u_matrix);
    }

    velocity = lerp(velocity, maxVelocity * moves.target, deltaTime * accelleration);
    let xTrasl = velocity * deltaTime;

    let subPos ={
      x: elementsToDraw[0].uniforms.u_matrix[12],
      y: elementsToDraw[0].uniforms.u_matrix[13],
      z: elementsToDraw[0].uniforms.u_matrix[14],
    }

    if(velocity !=0 && (subPos.x + xTrasl > wallPos.x +( 2 * moves.target))){
      console.log("subPos.x:"+subPos.x.toString()+"  xTrasl: "+xTrasl.toString()+"   wallPos.x: "+wallPos.x.toString()+"   target: "+ moves.target.toString());
      moves.stopTarget();
      //TODO: fai esplodere tutto
    } else if(velocity != 0 && (subPos.x + xTrasl > wallPos.x +( 2 * moves.target))){

    }else{
      m4.translate(elementsToDraw[0].uniforms.u_matrix, xTrasl,0,0, elementsToDraw[0].uniforms.u_matrix);
      elementsToDraw[1].uniforms.u_matrix = adaptPropellersTransl(elementsToDraw[0].uniforms.u_matrix, elementsToDraw[1].uniforms.u_matrix);
    }


   
    



    /*-- posizione luce del sottomarino -- */
    // definito in base alla posizione della camera
    var subLightPos = [camera[12], camera[13], camera[14]];

    
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

    /*-- Informazioni condivise -- */
    let u_world= m4.identity();
    const u_worldInverseTraspose = m4.transpose(m4.inverse(u_world));

    const sharedUniforms = {
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPositionVector,
      opacity:0.4,
      u_lightWorldPosition: [0, 20, 0],
      u_lightWorldIntensity: 0.8,  //quando vado in profondità forse lo devo diminuire di 0.001
      u_lightWorldDirection: [-0.5, 3, 0],
      u_worldInverseTraspose: u_worldInverseTraspose,
      //luce sottomarino
      u_lightSubPosition: subLightPos,
      u_lightSubIntensity: 0,
      u_lightSubDirection: m4.translate(1,-1,1, subLightPos), //capire come modificarlo
    };
    gl.useProgram(programInfo.program);
    // calls gl.uniform
    webglUtils.setUniforms(programInfo, sharedUniforms);


    

    // ------ Draw the objects --------
    //u_world sono le coordinate dell'oggetto nel mondo
    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;
 
    elementsToDraw.forEach(function(object) {
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
      let m = object.uniforms.u_matrix;
      // gestisco l'animazione delle eliche
      if(object.animate){
        degree = (degree > 360 ? 0 : (degree + 4 + 3.5 *Math.abs(velocity/maxVelocity)));
        m = m4.xRotate(m, degToRad(degree),m4.copy(m));
      }
      
      

      // renderizzo passando più array //
      for (const {bufferInfo, material} of object.parts) {
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        
        // calls gl.uniform
        webglUtils.setUniforms(programInfo, { u_world: m,  }, material); // come parametro solo cose scritte nel vertex shader

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
