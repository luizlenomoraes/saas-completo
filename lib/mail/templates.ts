export const emailStyles = `
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px 20px; }
    .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; font-size: 12px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    .info-box { background-color: #f9f9f9; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
`

export function getWelcomeEmailTemplate(productName: string, customerName: string, accessLink: string, email: string, tempPass: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${emailStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Compra Aprovada! 🎉</h1>
        </div>
        <div class="content">
            <p>Olá, <strong>${customerName}</strong>!</p>
            <p>Sua compra do produto <strong>${productName}</strong> foi confirmada com sucesso.</p>
            
            <p>Aqui estão seus dados de acesso à área de membros:</p>
            
            <div class="info-box">
                <p><strong>Link de Acesso:</strong> <a href="${accessLink}">${accessLink}</a></p>
                <p><strong>Login:</strong> ${email}</p>
                <p><strong>Senha Temporária:</strong> ${tempPass}</p>
            </div>

            <p>Recomendamos que você altere sua senha após o primeiro acesso.</p>

            <center>
                <a href="${accessLink}" class="button">Acessar Meu Produto</a>
            </center>
        </div>
        <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; ${new Date().getFullYear()} Checkout Platform</p>
        </div>
    </div>
</body>
</html>
    `
}

export function getGenericNotificationTemplate(title: string, message: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${emailStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="background-color: #3b82f6;">
            <h1>${title}</h1>
        </div>
        <div class="content">
            <p>${message}</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Checkout Platform</p>
        </div>
    </div>
</body>
</html>
    `
}
