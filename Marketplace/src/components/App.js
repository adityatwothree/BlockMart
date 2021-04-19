import React, { Component } from 'react';
import Web3 from 'web3'
import logo from '../logo.png';
import './App.css';
import Marketplace from '../abis/Marketplace.json'
import Navbar from './Navbar'
import Main from './Main'

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }
  constructor(props) {
    super(props)
    this.state = {
      account: '',
      productCount: 0,
      products: [],
      loading: true
    }
    this.createProduct = this.createProduct.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this)
  }
  async loadBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    const networkId = await web3.eth.net.getId()
    const networkData = Marketplace.networks[networkId]
    if (networkData) {
      const marketplace = web3.eth.Contract(Marketplace.abi, networkData.address)
      this.setState({ marketplace })
      const productCount = await marketplace.methods.productCount().call()
      this.setState({ productCount })
      for (var i = 1; i <= productCount; i++) {
        const product = await marketplace.methods.products(i).call()
        this.setState({
          products: [...this.state.products, product]
        })
      }
      // see ... is a spread operator, here the array products is added with this new product and then returned to this old array

      this.setState({ loading: false })
    } else {
      window.alert("bro it doesnt exsist, the contract is not deployed on the network")
    }
  }
  /*
  we create a web3 object, with that we get the accounts, we get the value of the accounts state variable which we have created
  on top of that, we use web3 to get the network ids too, once we get the network id, we can access the network data too
  and when we are having the network data, network data is the data that is of the network on which the code is deployed
  if the network data is there, then we seek the contract, for accessing contract we need two things
  one is the abi, abi is the file which is formed when the code is compiled, the solidity code and contains meta data about it
  and we need the address too, for that, we go for the networks in the same json file and there in that we acess the address
  this is how we get the marketplace, we use the marketplace with set state, to make it a state variable
  otherwise set state is used to set the value of the state variables
  */
  createProduct(name, price) {
    this.setState({ loading: true })
    this.state.marketplace.methods.createProduct(name, price).send({ from: this.state.account })
      .once('reciept', (receipt) => {
        this.setState({ loading: false })
      })
  }
  purchaseProduct(id, price) {
    this.setState({ loading: true })
    this.state.marketplace.methods.purchaseProduct(id).send({ from: this.state.account, value: price })
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
  }

  /*
  in this we have used a function create product
  since we are startin with the blockchain we do the loading first
  once the loading is done, we create the product by calling the function of the contract
  */
  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              {this.state.loading
                ? <div id="loader" className="text-center"><p className="text-center">Loading...</p></div>
                : <Main
                  products={this.state.products}
                  createProduct={this.createProduct}
                  purchaseProduct={this.purchaseProduct} />
              }
            </main>
          </div>
        </div>
      </div>
    );
  }
}
/*
here we passed the this.createProduct into the createproduct and passed it to the main fucntion
we have call and we have send, send is used to send the data while call is used to just call in the function
*/
export default App;
