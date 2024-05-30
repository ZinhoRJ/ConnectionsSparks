function verify(array1, array2) {
    // Criar arrays vazios para armazenar elementos não nulos
    const array1SemNull = [];
    const array2SemNull = [];
  
    // Preencher arrays sem null
    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== null) {
        array1SemNull.push(array1[i]);
      }
    }
  
    for (let i = 0; i < array2.length; i++) {
      if (array2[i] !== null) {
        array2SemNull.push(array2[i]);
      }
    }
  
    // Verificar se os arrays sem null possuem o mesmo tamanho
    if (array1SemNull.length !== array2SemNull.length) {
      console.log("Os arrays possuem diferentes quantidades de elementos não nulos.");
      return;
    }
  
    // Comparar elementos não nulos
    for (let i = 0; i < array1SemNull.length; i++) {
      if (array1SemNull[i] !== array2SemNull[i]) {
        console.log("Os arrays possuem elementos não nulos diferentes.");
        return;
      }
    }
  
    // Se chegar nesse ponto, os arrays possuem os mesmos elementos não nulos
    console.log("Os arrays possuem os mesmos elementos não nulos.");
    return true;
  }
  
  const array1 = [1, null, 2, 3];
  const array2 = [1, null, 2, 3];
  
verify(array1, array2); // Imprime: "Os arrays possuem os mesmos elementos não nulos."

module.exports = { verificarTags };