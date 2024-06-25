class Move{
    /* -- Gestione della navigazione -- */
    rotateLeft;           //tasto A 
    rotateRight;         //tasto D
    foward;              //tasto W
    back;                //tasto S
    dive;                 //tasto X
    emerge;               //tasto E
    target;
    

   constructor(){
    this.rotateLeft= false;           //tasto A 
    this.rotateRight = false;         //tasto D
    this.foward = false;              //tasto W
    this.back = false;                //tasto S
    this.dive =false;                 //tasto X
    this.emerge= false;               //tasto E
    this.target =0;
   }
   
  
  pressKey(keyCode){
    switch(keyCode){
        //avanti W
        case 87: 
            this.foward = true;
            this.target = -1;
            break;
        //indietro S
        case 83:
            this.back=true;
            this.target = 1;
            break;
        //su E
        case 69: 
            this.emerge=true;
            break;
        //giù X
        case 88: 
            this.dive=true;
            break;
        //ruota dx D
        case 68:
            this.rotateRight = true;
            break;
        //ruota sx A
        case 65:
            this.rotateLeft= true;
            break;
    }
  }
   
  releaseKey(keyCode){
    switch(keyCode){
        //avanti
        case 87: 
            this.foward = false;
            this.target =0;
            break;
        //indietro
        case 83:
            this.back=false;
            this.target =0;
            break;
        //su E
        case 69: 
            this.emerge=false;
            break;
        //giù
        case 88: 
            this.dive=false;
            break;
        // ruota dx
        case 68:
            this.rotateRight = false;
            break;
        //ruota sx
        case 65:
            this.rotateLeft= false;
            break;
      }
  }

  
  
}