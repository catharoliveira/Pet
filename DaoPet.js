"use strict";

import ModelError from "/ModelError.js";
import Pet from "/Pet.js";

export default class DaoPet {
  //-----------------------------------------------------------------------------------------//

  static conexao = null;

  constructor() {
    this.arrayPet = [];
    this.obterConexao();
  }

  //-----------------------------------------------------------------------------------------//

  /*
   *  Devolve uma Promise com a referência para o BD
   */
  async obterConexao() {
    if (DaoPet.conexao == null) {
      DaoPet.conexao = new Promise(function (resolve, reject) {
        let requestDB = window.indexedDB.open("PetDB", 1);

        requestDB.onupgradeneeded = (event) => {
          let db = event.target.result;
          let store = db.createObjectStore("PetST", {
            autoIncrement: true,
          });
          store.createIndex("idxComercial", "comercial", { unique: true });
        };

        requestDB.onerror = (event) => {
          reject(new ModelError("Erro: " + event.target.errorCode));
        };

        requestDB.onsuccess = (event) => {
          if (event.target.result) {
            // event.target.result apontará para IDBDatabase aberto
            resolve(event.target.result);
          } else reject(new ModelError("Erro: " + event.target.errorCode));
        };
      });
    }
    return await DaoPet.conexao;
  }

  //-----------------------------------------------------------------------------------------//

  async obterPet() {
    let connection = await this.obterConexao();
    let promessa = new Promise(function (resolve, reject) {
      let transacao;
      let store;
      let indice;
      try {
        transacao = connection.transaction(["PetST"], "readonly");
        store = transacao.objectStore("PetST");
        indice = store.index("idxComercial");
      } catch (e) {
        reject(new ModelError("Erro: " + e));
      }
      let array = [];
      indice.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          const novo = Pet.assign(cursor.value);
          array.push(novo);
          cursor.continue();
        } else {
          resolve(array);
        }
      };
    });
    this.arrayPet = await promessa;
    return this.arrayPet;
  }

  //-----------------------------------------------------------------------------------------//

  async obterPetPeloComercial(comercial) {
    let connection = await this.obterConexao();
    let promessa = new Promise(function (resolve, reject) {
      let transacao;
      let store;
      let indice;
      try {
        transacao = connection.transaction(["PetST"], "readonly");
        store = transacao.objectStore("PetST");
        indice = store.index("idxComercial");
      } catch (e) {
        reject(new ModelError("Erro: " + e));
      }

      let consulta = indice.get(comercial);
      consulta.onsuccess = function (event) {
        if (consulta.result != null) resolve(Pet.assign(consulta.result));
        else resolve(null);
      };
      consulta.onerror = function (event) {
        reject(null);
      };
    });
    let Pet = await promessa;
    return Pet;
  }

  //-----------------------------------------------------------------------------------------//

  async obterPetPeloAutoIncrement() {
    let connection = await this.obterConexao();
    let promessa = new Promise(function (resolve, reject) {
      let transacao;
      let store;
      try {
        transacao = connection.transaction(["PetST"], "readonly");
        store = transacao.objectStore("PetST");
      } catch (e) {
        reject(new ModelError("Erro: " + e));
      }
      let array = [];
      store.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          const novo = Pet.assign(cursor.value);
          array.push(novo);
          cursor.continue();
        } else {
          resolve(array);
        }
      };
    });
    this.arrayPet = await promessa;
    return this.arrayPet;
  }

  //-----------------------------------------------------------------------------------------//

  async incluir(Pet) {
    let connection = await this.obterConexao();
    let resultado = new Promise((resolve, reject) => {
      let transacao = connection.transaction(["PetST"], "readwrite");
      transacao.onerror = (event) => {
        reject(
          new ModelError(
            "Não foi possível incluir o Pet",
            event.target.error
          )
        );
      };
      let store = transacao.objectStore("PetST");
      let requisicao = store.add(Pet.deassign(Pet));
      requisicao.onsuccess = function (event) {
        resolve(true);
      };
    });
    return await resultado;
  }

  //-----------------------------------------------------------------------------------------//

  async alterar(Pet) {
    let connection = await this.obterConexao();
    let resultado = new Promise(function (resolve, reject) {
      let transacao = connection.transaction(["PetST"], "readwrite");
      transacao.onerror = event => {
        reject(
          new ModelError(
            "Não foi possível alterar o Pet",
            event.target.error
          )
        );
      };
      let store = transacao.objectStore("PetST");
      let indice = store.index("idxComercial");
      var keyValue = IDBKeyRange.only(Pet.getcomercial());
      indice.openCursor(keyValue).onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.comercial == Pet.getcomercial()) {
            const request = cursor.update(Pet.deassign(Pet));
            request.onsuccess = () => {
              console.log("[DaoPet.alterar] Cursor update - Sucesso ");
              resolve("Ok");
              return;
            };
          }
        } else {
          reject(
            new ModelError(
              "Pet com o nome " +
                Pet.getcomercial() +
                " não encontrado!",
              ""
            )
          );
        }
      };
    });
    return await resultado;
  }

  //-----------------------------------------------------------------------------------------//

 async excluir(Pet) {
    let connection = await this.obterConexao();
    let transacao = await new Promise(function (resolve, reject) {
      let transacao = connection.transaction(["PetST"], "readwrite");
      transacao.onerror = (event) => {
        reject(
          new ModelError(
            "Não foi possível excluir o Pet",
            event.target.error
          )
        );
      };
      let store = transacao.objectStore("PetST");
      let indice = store.index("idxComercial");
      var keyValue = IDBKeyRange.only(Pet.getcomercial());
      indice.openCursor(keyValue).onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.comercial == Pet.getcomercial()) {
            const request = cursor.delete();
            request.onsuccess = () => {
              resolve("Ok");
            };
            return;
          }
        } else {
          reject(
            new ModelError(
              "Pet com o nome " +
                Pet.getcomercial() +
                " não encontrado!",
              ""
            )
          );
        }
      };
    });
    return false;
  }

  //-----------------------------------------------------------------------------------------//
}