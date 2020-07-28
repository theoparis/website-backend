import { App } from './index'
const port = process.env.SERVER_PORT || 8080

App.listen(port, () => {
    console.log(`Express server listening on 0.0.0.0:${port}`)
})
