#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};

use rand::Rng;
use tauri::{Manager, Window};

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
    println!("task id {id} over");
}
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // the default value is `main`. note that it must be unique
            let main_window = app.get_window("main").unwrap();
            let main_window = main_window.clone();

			let sender_vec = Arc::new(Mutex::new(Vec::<Sender<bool>>::new()));
			let sender_vec_copy = sender_vec.clone();
            main_window.listen("cancel-all", move |_| {
				println!("clear all");
				let sender_vec_copy = sender_vec_copy.clone();
				std::thread::spawn(move ||{
					let mut m: std::sync::MutexGuard<Vec<Sender<bool>>> = sender_vec_copy.lock().unwrap();
					for i in &*m{
						i.send(true).unwrap();
					}
					m.clear();
				});
            });
            let for_register = main_window.clone();
            let task_id = Arc::new(std::sync::Mutex::new(0));
            for_register.listen("start", move |_| {
                println!("invoke");
				let sender_vec_copy = sender_vec.clone();
				let t = std::thread::spawn(move ||{
					let mut m_vec: std::sync::MutexGuard<Vec<Sender<bool>>> = sender_vec_copy.lock().unwrap();
					for i in &*m_vec{
						i.send(true).unwrap();
					}
					m_vec.clear();
				});
				println!("invoke clear other tasks running");
				t.join().unwrap();
                let main_window = main_window.clone();
                let mut m = task_id.lock().unwrap();
                let id = *m;
                *m += 1;
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
						});
				});
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
