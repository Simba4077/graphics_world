class Cube{
  constructor(){
    this.type='cube';
    this.color=[1.0,1.0,1.0,1.0];
    this.matrix = new Matrix4(); //uncomment when using 
    this.textureNum = -1; //use UV color as default
    this.cubeVerts = new Float32Array([
      // Front face
      0.0, 0.0, 0.0,
      1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      1.0, 1.0, 0.0,

      // Top face
      0.0, 1.0, 0.0,
      0.0, 1.0, 1.0,
      1.0, 1.0, 1.0,
      0.0, 1.0, 0.0,
      1.0, 1.0, 1.0,
      1.0, 1.0, 0.0,

      // Right face
      1.0, 0.0, 0.0,
      1.0, 1.0, 1.0,
      1.0, 0.0, 1.0,
      1.0, 0.0, 0.0,
      1.0, 1.0, 0.0,
      1.0, 1.0, 1.0,

      // Bottom face
      1.0, 0.0, 0.0,
      0.0, 0.0, 1.0,
      1.0, 0.0, 1.0,
      1.0, 0.0, 0.0,
      0.0, 0.0, 0.0,
      0.0, 0.0, 1.0,

      // Back face
      0.0, 0.0, 1.0,
      1.0, 1.0, 1.0,
      0.0, 1.0, 1.0,
      0.0, 0.0, 1.0,
      1.0, 0.0, 1.0,
      1.0, 1.0, 1.0,

      // Left face
      0.0, 0.0, 0.0,
      0.0, 1.0, 1.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 0.0,
      0.0, 0.0, 1.0,
      0.0, 1.0, 1.0,
    ]);
    this.cubeUVs=new Float32Array([
      // Front face
      0,0, 1,1, 1,0,
      0,0, 0,1, 1,1,
      // Top face
      0,1, 0,0, 1,0,
      0,1, 1,0, 1,1,
      // Right face
      1,0, 0,1, 0,0,
      1,0, 1,1, 0,1,
      // Bottom face
      1,0, 0,1, 0,0,
      1,0, 1,1, 0,1,
      // Back face
      1,0, 0,1, 1,1,
      1,0, 0,0, 0,1,
      // Left face
      1,0, 0,1, 1,1,
      1,0, 0,0, 0,1,
    ]);
  }

  render(){
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum); //set the texture number
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    //Pass the matrix to u_ModelMatrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // front face of cube
    drawTriangle3DUV( [0.0,0.0,0.0,  1.0,1.0,0.0,  1.0,0.0,0.0], [0,0, 1,1, 1,0] );
    drawTriangle3DUV( [0.0,0.0,0.0,  0.0,1.0,0.0,  1.0,1.0,0.0], [0,0, 0,1, 1,1] );

    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
    // top of cube
    drawTriangle3DUV( [0.0,1.0,0.0,  0.0,1.0,1.0,  1.0,1.0,1.0], [0,1, 0,0, 1,0] );
    drawTriangle3DUV( [0.0,1.0,0.0,  1.0,1.0,1.0,  1.0,1.0,0.0], [0,1, 1,0, 1,1]);

    gl.uniform4f(u_FragColor, rgba[0]*0.2, rgba[1]*0.2, rgba[2]*0.2, rgba[3]);
    //right face of cube
    drawTriangle3DUV( [1.0,0.0,0.0,  1.0,1.0,1.0,  1.0,0.0,1.0], [1,0, 0,1, 0,0] );
    drawTriangle3DUV( [1.0,0.0,0.0,  1.0,1.0,0.0,  1.0,1.0,1.0], [1,0, 1,1, 0,1] );
    
    gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
    //botom face of cube
    drawTriangle3DUV( [1.0,0.0,0.0,  0.0,0.0,1.0,  1.0,0.0,1.0], [1,0, 0,1, 0,0 ]);
    drawTriangle3DUV( [1.0,0.0,0.0,  0.0,0.0,0.0,  0.0,0.0,1.0], [1,0, 1,1, 0,1] );

    gl.uniform4f(u_FragColor, rgba[0]*1., rgba[1]*1., rgba[2]*1., rgba[3]);
    //back face of cube
    drawTriangle3DUV( [0.0,0.0,1.0,  1.0,1.0,1.0,  0.0,1.0,1.0], [1,0, 0,1, 1,1] );
    drawTriangle3DUV( [0.0,0.0,1.0,  1.0,0.0,1.0,  1.0,1.0,1.0], [1,0, 0,0, 0,1] );

    gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
    //left face of cube
    drawTriangle3DUV( [0.0,0.0,0.0,  0.0,1.0,1.0,  0.0,1.0,0.0], [1,0, 0,1, 1,1] );
    drawTriangle3DUV( [0.0,0.0,0.0,  0.0,0.0,1.0,  0.0,1.0,1.0], [1,0, 0,0, 0,1] );
  }


renderfast(){
    var rgba = this.color;
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
    if(g_vertexBuffer == null){
      initTriangle3D();
    }

    // Bind vertex buffer and upload vertex data
    gl.bufferData(gl.ARRAY_BUFFER, this.cubeVerts, gl.DYNAMIC_DRAW);
    
    if(g_uvBuffer == null){
      initUVBuffer();
    }


    // Bind UV buffer and upload UV data
    gl.bufferData(gl.ARRAY_BUFFER, this.cubeUVs, gl.DYNAMIC_DRAW);
    
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

} 

