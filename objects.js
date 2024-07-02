class SeaObject{
    /*-- Variabili dell'oggetto --*/
    obj;
    parts;
    uniforms;
    u_matrix;
    animate;

    
    constructor(fullObj){
        this.obj = fullObj.obj;
        this.parts = fullObj.parts;
        this.u_matrix=m4.identity();
        this.uniforms = {
            u_matrix: this.u_matrix,
        }
        this.animate = false;
    }

    //definisco proprietà di animazione
    setAnimate(){this.animate = !this.animate;}

    //metodo per traslare l'oggetto in una posizione predefinita
    translateObj(tx, ty, tz){
        this.u_matrix = m4.translation(tx, ty, tz, this.u_matrix);
    }

    //prendo le coordinate dell'oggetto nello spazio
    getX(){ return this.u_matrix[12];}
    getY(){ return this.u_matrix[13];}
    getZ(){ return this.u_matrix[14];}

}