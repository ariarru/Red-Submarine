class Object{
    /*-- Variabili dell'oggetto --*/
    obj;
    parts;
    uniforms;
    animate;

    
    constructor(fullObj){
        this.obj = fullObj.obj;
        this.parts = fullObj.parts;
        this.uniforms = {
            u_matrix: m4.identity(),
        }
        this.animate = false;
    }

    //definisco proprietà di animazione
    setAnimate(){this.animate = !this.animate;}

    //metodo per traslare l'oggetto in una posizione predefinita
    translateObj(tx, ty, tz){
        this.uniforms.u_matrix = m4.translation(tx, ty, tz, this.uniforms.u_matrix);
    }

    //prendo le coordinate dell'oggetto nello spazio
    getPosX(){ return this.uniforms.u_matrix[12];}
    getPosY(){ return this.uniforms.u_matrix[13];}
    getPosZ(){ return this.uniforms.u_matrix[14];}
}