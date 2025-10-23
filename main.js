const http = require("http");
const fs = require("fs").promises;
const { Command } = require("commander");
const { XMLBuilder } = require("fast-xml-parser");

const program = new Command();

program
  .requiredOption("-i, --input <path>", "Input file path")
  .requiredOption("-h, --host <host>", "Server host")
  .requiredOption("-p, --port <port>", "Server port");

program.parse(process.argv);
const options = program.opts();

const server = http.createServer(async (req, res) => {
  try {
    // Читаємо та парсимо JSON файл
    const data = await fs.readFile(options.input, "utf-8");
    let passengers = JSON.parse(data);

    // Парсимо URL та параметри запиту
    const url = new URL(req.url, `http://${options.host}:${options.port}`);
    const survived = url.searchParams.get("survived");
    const age = url.searchParams.get("age");

    // Фільтрація за виживанням
    if (survived === "true") {
      passengers = passengers.filter(p => p.Survived == 1);
    } else if (survived === "false") {
      passengers = passengers.filter(p => p.Survived == 0);
    }

    // Форматуємо результат
    const result = passengers.map(p => {
      const passenger = {
        name: p.Name,
        ticket: p.Ticket
      };
      
      // Додаємо вік якщо вказано параметр age=true
      if (age === "true") {
        passenger.age = p.Age;
      }
      
      return passenger;
    });

    // Створюємо XML структуру
    const xmlData = {
      passengers: {
        passenger: result
      }
    };

    // Конвертуємо в XML
    const builder = new XMLBuilder({
      format: true,
      ignoreAttributes: false,
      suppressEmptyNode: true
    });
    
    const xml = builder.build(xmlData);

    // Відправляємо відповідь
    res.writeHead(200, { 
      "Content-Type": "application/xml",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(xml);

  } catch (err) {
    console.error("Error:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Error reading input file");
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
  console.log(`Input file: ${options.input}`);
});