const Marketplace = artifacts.require("./Marketplace.sol")

require('chai')
    .use(require("chai-as-promised"))
    .should()


contract("Marketplace", ([deployer, seller, buyer]) => {
    let marketplace
    before(async () => {
        marketplace = await Marketplace.deployed()
    })
    describe('deployment', async () => {
        it('deploys successfully', async () => {
            const address = await marketplace.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, "")
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })
        //address is the intrinsic property so we didnt use that "()"
        it("has a name", async () => {
            const name = await marketplace.name()
            assert.equal(name, "The MarketPlace")
        })
    })
    // the name is the property we have defined and for that we need the name with ()    
    describe('products', async () => {
        let result, productCount
        before(async () => {
            result = await marketplace.createProduct('iphoneX', web3.utils.toWei('1', 'Ether'), { from: seller })
            productCount = await marketplace.productCount()
        })
        /*
        we call the function create products that returns the product in the result varibale, now on the result value, we run the logs
        the logs are the details as to what is stored in which argument, and they have to be addressed like an array, from there 
        we get the logs and using assert, we check if the values we expect are the same that are returned by it or not
        assert is from Mocha
        */
        it("creates products", async () => {
            assert.equal(productCount, 1)
            //console.log(result.logs)
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), productCount.toNumber(), "id is correct")
            assert.equal(event.name, 'iphoneX', 'name is correct')
            assert.equal(event.price, '1000000000000000000', 'price is correct')
            assert.equal(event.owner, seller, 'owner is correct')
            assert.equal(event.purchased, false, "purchased is correct")
            await await marketplace.createProduct("", web3.utils.toWei('1', 'Ether'), { from: seller }).should.be.rejected;
            //we wrote should be rejected because we wanted that case to be rejected
            await await marketplace.createProduct("iphoneX", '0', { from: seller }).should.be.rejected;

        })
        it("lists products", async () => {
            const product = await marketplace.products(productCount)
            assert.equal(product.id.toNumber(), productCount.toNumber(), "id is correct")
            assert.equal(product.name, 'iphoneX', 'name is correct')
            assert.equal(product.price, '1000000000000000000', 'price is correct')
            assert.equal(product.owner, seller, 'owner is correct')
            assert.equal(product.purchased, false, "purchased is correct")
            // see in the first one we checked if we are able to create a product or not and this was done using the create product
            //event calling okay, and then here we have used the other one, which is we are checking the listing of the product
            //so here the product which is used with marketplace is actually the object of the structure of product okay
        })
        it("sells products", async () => {
            let oldSellerBalance
            oldSellerBalance = await web3.eth.getBalance(seller)
            oldSellerBalance = new web3.utils.BN(oldSellerBalance)
            result = await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') })
            console.log(result.logs);
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), productCount.toNumber(), "id is correct")
            assert.equal(event.name, "iphoneX", "the product is correct")
            assert.equal(event.price, web3.utils.toWei('1'), "price is correct")
            assert.equal(event.owner, buyer, "seller is correct")
            assert.equal(event.purchased, true, "purchased is correct")
            //true is not written as a string 

            let newSellerBalance
            newSellerBalance = await web3.eth.getBalance(seller)
            newSellerBalance = new web3.utils.BN(newSellerBalance)

            let price
            price = web3.utils.toWei('1', 'Ether')
            price = new web3.utils.BN(price)

            //console.log(oldSellerBalance, newSellerBalance, price)
            //we check if the money is receieved by calculating the change in the balance and then matching it up            
            const expectedBalance = oldSellerBalance.add(price)
            assert.equal(newSellerBalance.toString(), expectedBalance.toString())

            //FAILURE CASE
            //product id is not valid wala case
            await marketplace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
            //buying with lesser amounts of ether than required
            await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
            //buyer tries to buy a product already purchased    
            await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'Ether') }).should.be.rejected;
            //buyer tries to buy the product he himself is selling
            await marketplace.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
            //buyer trying to buy the product twice
            await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
        })
    })
})
