class Cube{
  constructor(){
    this.type='cube';
    this.color=[1.0,1.0,1.0,1.0];
    this.matrix = new Matrix4(); 
  }

  render(){
    var rgba = this.color;

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    //Pass the matrix to u_ModelMatrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // front face of cube
    drawTriangle3DUV( [0,0,0,  1,1,0,  1,0,0], [1,0, 0,1, 1,1]);
    drawTriangle3D( [0.0,0.0,0.0,  1.0,1.0,0.0,  1.0,0.0,0.0] );
    drawTriangle3D( [0.0,0.0,0.0,  0.0,1.0,0.0,  1.0,1.0,0.0] );

    gl.uniform4f(u_FragColor, rgba[0]*1.3, rgba[1]*1.3, rgba[2]*1.3, rgba[3]);
    // top of cube
    drawTriangle3D( [0.0,1.0,0.0,  0.0,1.0,1.0,  1.0,1.0,1.0] );
    drawTriangle3D( [0.0,1.0,0.0,  1.0,1.0,1.0,  1.0,1.0,0.0] );

    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    //right face of cube
    drawTriangle3D( [1.0,0.0,0.0,  1.0,1.0,1.0,  1.0,0.0,1.0] );
    drawTriangle3D( [1.0,0.0,0.0,  1.0,1.0,0.0,  1.0,1.0,1.0] );
    
    gl.uniform4f(u_FragColor, rgba[0]*0.4, rgba[1]*0.4, rgba[2]*0.4, rgba[3]);
    //botom face of cube
    drawTriangle3D( [1.0,0.0,0.0,  0.0,0.0,1.0,  1.0,0.0,1.0] );
    drawTriangle3D( [1.0,0.0,0.0,  0.0,0.0,0.0,  0.0,0.0,1.0] );

    gl.uniform4f(u_FragColor, rgba[0]*.3, rgba[1]*.3, rgba[2]*.3, rgba[3]);
    //back face of cube
    drawTriangle3D( [0.0,0.0,1.0,  1.0,1.0,1.0,  0.0,1.0,1.0] );
    drawTriangle3D( [0.0,0.0,1.0,  1.0,0.0,1.0,  1.0,1.0,1.0] );

    gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
    //left face of cube
    drawTriangle3D( [0.0,0.0,0.0,  0.0,1.0,1.0,  0.0,1.0,0.0] );
    drawTriangle3D( [0.0,0.0,0.0,  0.0,0.0,1.0,  0.0,1.0,1.0] );
  }
} 