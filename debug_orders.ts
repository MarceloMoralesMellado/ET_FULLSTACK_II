import { pb } from "./lib/pocketbase"

async function debugOrders() {
    try {
        console.log("Authenticating as admin...")
        // Assuming we can read without auth or using the hardcoded client in lib
        // If auth is needed, we might need to login. But let's try reading first.
        // The lib/pocketbase export might not be authenticated as admin.
        // But for now let's try to just list.

        const records = await pb.collection("pedidos").getList(1, 5, {
            sort: '-created'
        })

        console.log(`Found ${records.items.length} orders.`)

        for (const record of records.items) {
            console.log(`Order ID: ${record.id}`)
            console.log("Raw productos field:", JSON.stringify(record.productos, null, 2))
            console.log("Type of productos:", typeof record.productos)
            if (Array.isArray(record.productos)) {
                console.log("Is Array. First item type:", typeof record.productos[0])
            }
            console.log("-------------------")
        }

    } catch (error) {
        console.error("Error:", error)
    }
}

debugOrders()
