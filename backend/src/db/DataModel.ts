import { firestore } from "firebase-admin";

export default abstract class DataModel<T, U> {
  // Fields
  private collection: firestore.CollectionReference<U>;
  private deserializer: (u: U & { id: string }) => Promise<T>;
  private serializer: (t: T) => Promise<U>;

  constructor(
    collection: firestore.CollectionReference<U>,
    deserializer: (u: U & { id: string }) => Promise<T>,
    serializer: (t: T) => Promise<U>
  ) {
    this.collection = collection;
    this.deserializer = deserializer;
    this.serializer = serializer;
  }

  // CRUD
  // Create
  protected async create(data: T): Promise<T> {
    const serializedData = await this.serializer(data);
    const docRef = await this.collection.add(serializedData);
    return this.deserializer({ ...serializedData, id: docRef.id });
  }

  // Read
  protected async read(id: string): Promise<T | null> {
    const dbData = await this.dbRead(id);
    if (!dbData) return null;
    return this.deserializer(dbData);
  }

  // DB Read (doesn't deserialize)
  protected async dbRead(id: string): Promise<(U & { id: string }) | null> {
    const docRef = await this.collection.doc(id).get();
    if (!docRef.exists) return null;
    return { ...(docRef.data() as U), id: docRef.id };
  }

  // Read all
  protected async readAll(): Promise<T[]> {
    const snapshot = await this.collection.get();
    return Promise.all(
      snapshot.docs.map((doc) =>
        this.deserializer({ ...(doc.data() as U), id: doc.id })
      )
    );
  }

  // Update
  protected async update(id: string, data: T): Promise<T> {
    const serializedData = await this.serializer(data);
    await this.dbUpdate(id, serializedData);
    return data;
  }

  // DB Update (doesn't serialize)
  protected async dbUpdate(id: string, data: U): Promise<U> {
    await this.collection.doc(id).update(data as firestore.UpdateData);
    return data;
  }

  // Delete
  protected async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
