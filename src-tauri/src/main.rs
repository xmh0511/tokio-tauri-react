#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};

use rand::Rng;
use tauri::{Manager, Window};
use tokio::sync::mpsc::UnboundedReceiver;
use tokio::task::JoinSet;

async fn task_worker(window: Window, id: i32) {
	println!("start task id {id}");
    let mut task = JoinSet::new();
    for i in 0..1 {
        let window = window.clone();
        task.spawn(async move {
            loop {
				//println!("running");
                let num = rand::thread_rng().gen_range(0..=100);
                //println!("invoke {}",num);
                window
                    .emit(
                        "fetch-data",
                        format!(r#"{{"data":{}, "index":{},"task_id":{id}}}"#, num, i),
                    )
                    .unwrap();
                tokio::time::sleep(std::time::Duration::from_millis(3000)).await;
            }
        });
    }
	while let Some(_) = task.join_next().await{

	}
    // while let Some(_) = canceller.lock().await.recv().await {
    //     println!("cancel-action");
    //     break;
    // }
    // task.shutdown().await;
    println!("task id {id} over");
}
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // the default value is `main`. note that it must be unique
            let main_window = app.get_window("main").unwrap();
            let main_window = main_window.clone();
            //let (tx, rx) = tokio::sync::mpsc::unbounded_channel::<bool>();
			//let (tx, rx) = std::sync::mpsc::channel::<bool>();
            //let rx = Arc::new(tokio::sync::Mutex::new(rx));
            main_window.listen_global("cancel-all", move |_| {
                //tx.send(true).unwrap();
            });
            // std::thread::spawn(move || {
            //     tokio::runtime::Builder::new_multi_thread()
            //         .enable_all()
            //         .build()
            //         .unwrap()
            //         .block_on(async move {
            //             task_worker(main_window.clone(),rx).await;
            //         });
            // });
            let for_register = main_window.clone();
            let task_id = Arc::new(std::sync::Mutex::new(0));
            // let manager = Arc::new(std::sync::Mutex::new(
            //     Option::<tokio::task::JoinHandle<()>>::None,
            // ));
            // let join_set = Arc::new(std::sync::Mutex::new(JoinSet::<()>::new()));
			let (tx, rx) = std::sync::mpsc::channel::<bool>();
			let rx = Arc::new(std::sync::Mutex::new(rx));
			//let join_set = Arc::new(std::sync::Mutex::new(JoinSet::new()));
			let sender_vec = Arc::new(Mutex::new(Vec::<Sender<bool>>::new()));
            for_register.listen("start", move |_| {
                println!("invoke");
				for i in &*sender_vec.lock().unwrap(){
					i.send(true).unwrap();
				}
				sender_vec.lock().unwrap().clear();
				// tokio::runtime::Builder::new_multi_thread()
				// .enable_all()
				// .build()
				// .unwrap()
				// .block_on(async move {
				// 	//join_set.lock().unwrap().shutdown().await;
				// });
				//tx.send(true).unwrap();
                let main_window = main_window.clone();
                let rx = rx.clone();
                let mut m = task_id.lock().unwrap();
                let id = *m;
                *m += 1;
                //let manager = manager.clone();
				let sender_vec = sender_vec.clone();
				let (tx,rx) = std::sync::mpsc::channel::<bool>();
				sender_vec.lock().unwrap().push(tx);
				std::thread::spawn(move || {
					tokio::runtime::Builder::new_multi_thread()
						.enable_all()
						.build()
						.unwrap()
						.block_on(async move {
							let r = tokio::spawn(task_worker(main_window.clone(), id));
							while let Ok(_) = rx.recv(){
								println!("task over {id}");
								r.abort();
							}
							// while let Some(_) = join_set.lock().unwrap().join_next().await{

							// }
						});
				});
            });
            //app.unlisten(id);
            // tokio::runtime::Builder::new_multi_thread()
            // .enable_all()
            // .build()
            // .unwrap()
            // .block_on(async move {
            // 	task_worker(main_window.clone(),rx).await;
            // });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
