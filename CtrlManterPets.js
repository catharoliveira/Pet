"use strict";

import Status from "/Status.js";
import Pet from "/Pet.js";
import DaoPet from "/DaoPet.js";
import ViewerPet from "/ViewerPet.js";

export default class CtrlManterPets {
  
  //-----------------------------------------------------------------------------------------//

  //
  // Atributos do Controlador
  //
  #dao;      // Referência para o Data Access Object para o Store de Pets
  #viewer;   // Referência para o gerenciador do viewer 
  #posAtual; // Indica a posição do objeto Pet que estiver sendo apresentado
  #status;   // Indica o que o controlador está fazendo 
  
  //-----------------------------------------------------------------------------------------//

  constructor() {
    this.#dao = new DaoPet();
    this.#viewer = new ViewerPet(this);
    this.#posAtual = 1;
    this.#atualizarContextoNavegacao();    
  }
  
  //-----------------------------------------------------------------------------------------//

  async #atualizarContextoNavegacao() {
    // Guardo a informação que o controlador está navegando pelos dados
    this.#status = Status.NAVEGANDO;

    // Determina ao viewer que ele está apresentando dos dados 
    this.#viewer.statusApresentacao();
    
    // Solicita ao DAO que dê a lista de todos os Pets presentes na base
    let conjPets = await this.#dao.obterPets();
    
    // Se a lista de Pets estiver vazia
    if(conjPets.length == 0) {
      // Posição Atual igual a zero indica que não há objetos na base
      this.#posAtual = 0;
      
      // Informo ao viewer que não deve apresentar nada
      this.#viewer.apresentar(0, 0, null);
    }
    else {
      // Se é necessário ajustar a posição atual, determino que ela passa a ser 1
      if(this.#posAtual == 0 || this.#posAtual > conjPets.length)
        this.#posAtual = 1;
      // Peço ao viewer que apresente o objeto da posição atual
      this.#viewer.apresentar(this.#posAtual, conjPets.length, conjPets[this.#posAtual - 1]);
    }
  }
  
  //-----------------------------------------------------------------------------------------//

  async apresentarPrimeiro() {
    let conjPets = await this.#dao.obterPets();
    if(conjPets.length > 0)
      this.#posAtual = 1;
    this.#atualizarContextoNavegacao();
  }

  //-----------------------------------------------------------------------------------------//

  async apresentarProximo() {
    let conjPets = await this.#dao.obterPets();
    if(this.#posAtual < conjPets.length)
      this.#posAtual++;
    this.#atualizarContextoNavegacao();
  }

  //-----------------------------------------------------------------------------------------//

  async apresentarAnterior() {
    let conjPets = await this.#dao.obterPets();
    if(this.#posAtual > 1)
      this.#posAtual--;
    this.#atualizarContextoNavegacao();
  }

  //-----------------------------------------------------------------------------------------//

  async apresentarUltimo() {
    let conjPets = await this.#dao.obterPets();
    this.#posAtual = conjPets.length;
    this.#atualizarContextoNavegacao();
  }

  //-----------------------------------------------------------------------------------------//
  
  iniciarIncluir() {
    this.#status = Status.INCLUINDO;
    this.#viewer.statusEdicao(Status.INCLUINDO);
    // Guardo a informação que o método de efetivação da operação é o método incluir. 
    // Preciso disto, pois o viewer mandará a mensagem "efetivar" (polimórfica) ao invés de 
    // "incluir"
    this.efetivar = this.incluir;
  }

  //-----------------------------------------------------------------------------------------//
  
  iniciarAlterar() {
    this.#status = Status.ALTERANDO;
    this.#viewer.statusEdicao(Status.ALTERANDO);
    // Guardo a informação que o método de efetivação da operação é o método incluir. 
    // Preciso disto, pois o viewer mandará a mensagem "efetivar" (polimórfica) ao invés de 
    // "alterar"
    this.efetivar = this.alterar;
  }

  //-----------------------------------------------------------------------------------------//
  
  iniciarExcluir() {
    this.#status = Status.EXCLUINDO;
    this.#viewer.statusEdicao(Status.EXCLUINDO);
    // Guardo a informação que o método de efetivação da operação é o método incluir. 
    // Preciso disto, pois o viewer mandará a mensagem "efetivar" (polimórfica) ao invés de 
    // "excluir"
    this.efetivar = this.excluir;
  }

  //-----------------------------------------------------------------------------------------//
 
  async incluir(matr, cpf, nome, email, telefone) {
    if(this.#status == Status.INCLUINDO) {
      try {
        let Pet = new Pet(matr, cpf, nome, email, telefone);
        await this.#dao.incluir(Pet); 
        this.#status = Status.NAVEGANDO;
        this.#atualizarContextoNavegacao();
      }
      catch(e) {
        alert(e);
      }
    }    
  }

  //-----------------------------------------------------------------------------------------//
 
  async alterar(matr, cpf, nome, email, telefone) {
    if(this.#status == Status.ALTERANDO) {
      try {
        let Pet = await this.#dao.obterPetPelaMatricula(matr); 
        if(Pet == null) {
          alert("Pet com a matrícula " + matr + " não encontrado.");
        } else {
          Pet.setCpf(cpf);
          Pet.setNome(nome);
          Pet.setEmail(email);
          Pet.setTelefone(telefone);
          await this.#dao.alterar(Pet); 
        }
        this.#status = Status.NAVEGANDO;
        this.#atualizarContextoNavegacao();
      }
      catch(e) {
        alert(e);
      }
    }    
  }

  //-----------------------------------------------------------------------------------------//
 
  async excluir(matr) {
    if(this.#status == Status.EXCLUINDO) {
      try {
        let Pet = await this.#dao.obterPetPelaMatricula(matr); 
        if(Pet == null) {
          alert("Pet com a matrícula " + matr + " não encontrado.");
        } else {
          await this.#dao.excluir(Pet); 
        }
        this.#status = Status.NAVEGANDO;
        this.#atualizarContextoNavegacao();
      }
      catch(e) {
        alert(e);
      }
    }    
  }

  //-----------------------------------------------------------------------------------------//

  cancelar() {
    this.#atualizarContextoNavegacao();
  }

  //-----------------------------------------------------------------------------------------//

  getStatus() {
    return this.#status;
  }

  //-----------------------------------------------------------------------------------------//
}

//------------------------------------------------------------------------//
