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
  const submarine = new SeaObject(subBody);
  elementsToDraw.push(submarine);  

  /* -- Dichiaro le eliche -- */
  const subPropellers = await generateBuffer('./res/sub-eliche.obj');
  const propellers = new SeaObject(subPropellers);
  propellers.animateX=true;

/*  var propUniform ={
    uniformMatrix: m4.copy(submarine.uniformMatrix),
  }*/
  /* aggiungo all'array le eliche*/
  elementsToDraw.push(propellers);  

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
      uniformMatrix : rockMatrix,
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
  const wall = new SeaObject(backWall);
  wall.translateObj(9, 0, 0);
  elementsToDraw.push(wall);



  /*--Dichiaro la bolla dentro il tesoro-- */
  const bubble = await generateBuffer('./res/bubble.obj');
  const faceBubble = new SeaObject(bubble);
  faceBubble.translateObj(-9,2,0);

  /*-- Definisco il tesoro --*/
  const treasure = await generateBuffer('./res/treasure/treasure-closed.obj');
  const closedTrasure = new SeaObject(treasure);
  closedTrasure.translateObj(-9,3,0);
  elementsToDraw.push(closedTrasure);

  const finishTreasure = await generateBuffer('./res/treasure/treasure-open.obj');
  const openTreasure = new SeaObject(finishTreasure);


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

  /* -- Variabili per la gestione dei movimenti -- */
  var degree=0;     //variabile cumulativa di gradi di rotazione delle eliche
  let then = 0;     //variabile per il calcolo del deltaTime

  let accelleration = 1.25; //accellerazione movimento
  let velocity=0;   //velocità del movimento del sottomairno
  let maxVelocity = 25; //massima velocità del sottomarino
  let bubbleVelocity =0; //velocità della bolla

  /*-- Variabili di gioco --*/
  var treasureFound = false;
  canvas.addEventListener("click", function(event){
    if(treasureFound){
      console.log("apriti sesamo");
      //tesoro diventa aperto
      let t = elementsToDraw.pop();
      openTreasure.uniformMatrix = m4.copy(t.uniformMatrix);
      console.log(closedTrasure.uniformMatrix);
      console.log(t.uniformMatrix);
      //controllo al fine di non far comparire troppi tesori aperti
      if(!elementsToDraw.includes(openTreasure)){
        elementsToDraw.push(openTreasure);
      }
      //bolla compare
      faceBubble.animateY=true;
      if(!elementsToDraw.includes(faceBubble)){
        elementsToDraw.push(faceBubble);
      }
      //aggiungi luce dentro tesoro
    }
  })

  /*-- Render Time --*/
  function render(time) {
    time *= 0.001;  // convert to seconds
    const deltaTime = time-then;
    then = time;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_TEST);


    /*-- Gestione camera --*/
    const camera = m4.yRotate(submarine.uniformMatrix, degToRad(90));
    m4.translate(camera, cameraPosition[0], cameraPosition[1], cameraPosition[2], camera);
    

    /*-- Gestione dei movimenti --*/
    moves.stopTarget();
    if(moves.foward && moves.ableFoward){
      moves.setTarget(-1);
    }
    if(moves.rotateLeft){
      m4.yRotate(elementsToDraw[0].uniformMatrix, degToRad(2), elementsToDraw[0].uniformMatrix);
      elementsToDraw[1].uniformMatrix = adaptPropellersRotateY(elementsToDraw[0].uniformMatrix, elementsToDraw[1].uniformMatrix);
      treasureFound=false; //se il sottomarino si sposta allora va via dal tesoro
     } 
    if(moves.rotateRight){
      m4.yRotate(elementsToDraw[0].uniformMatrix, degToRad(-2), elementsToDraw[0].uniformMatrix);
      elementsToDraw[1].uniformMatrix = adaptPropellersRotateY(elementsToDraw[0].uniformMatrix, elementsToDraw[1].uniformMatrix);
      treasureFound=false;
    }
    if(moves.back && moves.ableBack){
      moves.setTarget(1);
      treasureFound=false;
    }
    if(moves.dive){
      m4.zRotate(elementsToDraw[0].uniformMatrix, degToRad(2), elementsToDraw[0].uniformMatrix);
      m4.zRotate(elementsToDraw[1].uniformMatrix, degToRad(2), elementsToDraw[1].uniformMatrix);
      treasureFound=false;
    }
    if(moves.emerge){
      m4.zRotate(elementsToDraw[0].uniformMatrix, degToRad(-2), elementsToDraw[0].uniformMatrix);
      m4.zRotate(elementsToDraw[1].uniformMatrix, degToRad(-2), elementsToDraw[1].uniformMatrix);
      treasureFound=false;
    }
    velocity = lerp(velocity, maxVelocity * moves.target, deltaTime * accelleration); //variabile velocità di spostamento
    let xTrasl = velocity * deltaTime; //quantità di spostamento

    let valX = submarine.getX() + xTrasl; //variabile di controllo
    let posTreasure = closedTrasure.getX() - (3 * moves.target);
    let highFromTreasure = Math.abs(closedTrasure.getY()-submarine.getY());

    if(velocity !=0 && ( valX > wall.getX() +( 2 * moves.target))){
      moves.target > 0 ? moves.ableBack = false : moves.ableFoward = false;
      //TODO: fai esplodere tutto
    } else if(velocity != 0 && ( Math.abs(valX) >= Math.abs(posTreasure)) && highFromTreasure <= 1.5){
      moves.ableFoward = false;
      velocity = 0;
      treasureFound=true;
    }else{
      moves.ableFoward = true;
      moves.ableBack = true;
      m4.translate(elementsToDraw[0].uniformMatrix, xTrasl,0,0, elementsToDraw[0].uniformMatrix);
      elementsToDraw[1].uniformMatrix = adaptPropellersTransl(elementsToDraw[0].uniformMatrix, elementsToDraw[1].uniformMatrix);
    }

    //movimenti della bolla
    if(faceBubble.animateY && faceBubble.getY() < (openTreasure.getY() + 2.5)){
       bubbleVelocity = lerp(bubbleVelocity, 10, deltaTime);
       let bubbleTrasl = bubbleVelocity * deltaTime;
       m4.translate(faceBubble.uniformMatrix, 0, bubbleTrasl, 0, faceBubble.uniformMatrix);
    }
   
    



    /*-- posizione luce del sottomarino -- */
    // definito in base alla posizione della camera
    var subLightPos = [submarine.getX(), submarine.getY(), submarine.getZ()];
    var subLightDirection = m4.addVectors(subLightPos, [1, -1, 1], null);
    
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
      u_lightSubDirection: subLightDirection, //capire come modificarlo
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
      let m = object.uniformMatrix;
      // gestisco l'animazione delle eliche
      if(object.animateX){
        degree = (degree > 360 ? 0 : (degree + 4 + 3.5 *Math.abs(velocity/maxVelocity)));
        m = m4.xRotate(m, degToRad(degree),m4.copy(m));
      }
      //gestisco animazione bolla
      if(object.animateY){
        degree = (degree > 360 ? 0 : (degree + 0.5));
        m = m4.yRotate(m, degToRad(degree),m4.copy(m));
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
